import { requireUserEmail } from '~/session.server'
import { getFolderNamePath, isNonEmptyString, parseForm } from '~/utils.server'
import { Input } from '~/components/base/Input'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'
import { db } from '~/db/db.server'
import { FormError, RouteDataArgs, useParams, useRouteData } from 'solid-start'
import { folderForm } from '~/schemas/folder'

export const routeData = ({ params }: RouteDataArgs) =>
  createServerData$(
    async ([, id], { request }) => {
      const email = await requireUserEmail(request)
      const folders = await db.folder.findMany({ where: { owner: { email } } })

      const prohibitedFolders: string[] = []
      let currentProhibitedFolder: string | null | undefined = id
      while (currentProhibitedFolder) {
        prohibitedFolders.push(currentProhibitedFolder)
        currentProhibitedFolder = folders.find(
          (folder) => folder.parentFolderId === currentProhibitedFolder
        )?.id
      }

      const foldersWithMappedName = folders
        .filter((folder) => !prohibitedFolders.includes(folder.id))
        .map((folder) => {
          return {
            ...folder,
            name: getFolderNamePath(folder.id, folders),
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))

      return {
        folders: foldersWithMappedName,
        editedFolder: folders.find((folder) => folder.id === id)!,
      }
    },
    { key: () => ['folder', params.id] }
  )

export default function EditFolder() {
  const data = useRouteData<typeof routeData>()
  const params = useParams()

  const [isEditing, { Form }] = createServerAction$(
    async (form: FormData, { request }) => {
      const email = await requireUserEmail(request)
      const id = form.get('id')
      if (!isNonEmptyString(id)) {
        return new FormError('Missing data')
      }

      const folders = await db.folder.findMany({ where: { owner: { email } } })

      if (!folders.some((folder) => folder.id === id)) {
        throw new FormError(`Couldn't find folder with id ${id}`)
      }

      const { parentFolderId, name, color } = folderForm.parse(parseForm(form))

      const parentFolderIds: string[] = []
      let currentParentFolderId: string | null | undefined = parentFolderId
      while (currentParentFolderId) {
        parentFolderIds.push(currentParentFolderId)
        currentParentFolderId = folders.find(
          (f) => f.id === currentParentFolderId
        )?.parentFolderId
      }
      const parentIndex = parentFolderIds.findIndex(
        (parentId) => parentId === id
      )
      if (parentIndex > -1) {
        throw new FormError(
          `Cannot set folder as its own parent folder - parent: ${parentFolderId} can't have child: ${id} because parent is already a child of ${id} (${
            parentIndex + 1
          } levels deep)`
        )
      }

      await db.folder.update({
        where: {
          id,
        },
        data: {
          name,
          color,
          parentFolder: parentFolderId
            ? { connect: { id: parentFolderId } }
            : { disconnect: true },
        },
      })
      return redirect(
        parentFolderId ? `/flashcards/folder/${parentFolderId}` : `/flashcards`
      )
    }
  )

  const [isDeleting, { Form: DeleteForm }] = createServerAction$(
    async (form: FormData, { request }) => {
      const email = await requireUserEmail(request)
      const id = form.get('id')
      if (!isNonEmptyString(id)) {
        return new FormError('Missing data')
      }

      await db.folder.findFirstOrThrow({
        where: {
          id,
          owner: { email },
        },
      })

      const folder = await db.folder.findFirst({
        where: {
          id,
          owner: { email },
        },
        include: {
          folders: true,
          flashcards: true,
        },
      })
      if (!folder) {
        throw new FormError('Folder not found')
      }
      if (folder.folders.length > 0 || folder.flashcards.length > 0) {
        throw new FormError('Folder not empty')
      }
      await db.folder.delete({ where: { id } })
      return redirect('/flashcards')
    }
  )

  return (
    <div class="flex flex-col p-8">
      <Form>
        {isEditing.pending && <div>Loading...</div>}
        {isEditing.error && <div>{isEditing.error.message}</div>}
        <input type="hidden" name="id" value={params.id} />
        <div class="flex flex-col gap-2">
          <Input name="name" label="Name" value={data()?.editedFolder?.name} />
          <label class="flex">
            Color
            <input
              type="color"
              name="color"
              value={data()?.editedFolder?.color}
              class="w-full ml-2"
            />
          </label>
          <label>
            Parent folder
            <select
              name="parentFolderId"
              class="border-dark-gray border rounded-lg ml-2"
            >
              <option value="">None</option>
              {data()?.folders.map((folder) => (
                <option
                  selected={data()?.editedFolder.parentFolderId === folder.id}
                  value={folder.id}
                >
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            class="px-3 py-2 bg-blue text-white rounded-lg mt-2"
          >
            Save
          </button>
        </div>
      </Form>
      <DeleteForm class="flex flex-col mt-8 gap-2">
        {isDeleting.pending && <div>Loading...</div>}
        {isDeleting.error && <div>{isDeleting.error.message}</div>}
        <input type="hidden" name="id" value={params.id} />
        <label>
          <input type="checkbox" required class="mr-2" />I confirm that I want
          to delete this folder
        </label>
        <button
          type="submit"
          class="px-3 py-2 bg-red-500 text-white rounded-lg"
        >
          Delete
        </button>
      </DeleteForm>
    </div>
  )
}
