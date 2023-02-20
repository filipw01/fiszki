import { requireUserEmail } from '~/session.server'
import { getFolderPath, isNonEmptyString, isString } from '~/utils.server'
import { Input } from '~/components/base/Input'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'
import { db } from '~/db/db.server'
import { FormError, useRouteData, useSearchParams } from 'solid-start'

export const routeData = () =>
  createServerData$(async (_, { request }) => {
    const email = await requireUserEmail(request)
    const folders = await db.folder.findMany({ where: { owner: { email } } })
    return folders
      .map((folder) => {
        return {
          ...folder,
          name: getFolderPath(folder.id, folders),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  })

export default function CreateFolder() {
  const data = useRouteData<typeof routeData>()
  const [searchParams] = useSearchParams()
  const [isCreating, { Form }] = createServerAction$(
    async (form: FormData, { request }) => {
      const email = await requireUserEmail(request)

      const name = form.get('name')
      const color = form.get('color')
      const parentFolderId = form.get('parentFolderId')

      if (
        !isNonEmptyString(name) ||
        !isNonEmptyString(color) ||
        !isString(parentFolderId)
      ) {
        return new FormError('Missing data')
      }

      if (parentFolderId) {
        db.folder.findFirstOrThrow({
          where: {
            id: parentFolderId,
            owner: { email },
          },
        })
      }

      await db.folder.create({
        data: {
          name,
          color,
          owner: { connect: { email } },
          parentFolder: parentFolderId
            ? { connect: { id: parentFolderId } }
            : undefined,
        },
      })
      return redirect(
        parentFolderId ? `/flashcards/folder/${parentFolderId}` : `/flashcards`
      )
    }
  )
  return (
    <Form>
      {isCreating.pending && <div>Creating...</div>}
      {isCreating.error && <div>{isCreating.error.message}</div>}
      <div class="flex flex-col p-8 gap-2">
        <Input name="name" label="Name" />
        <label class="flex">
          Color
          <input
            type="color"
            name="color"
            value="#1982C4"
            class="w-full ml-2"
          />
        </label>
        <label>
          Parent folder
          <select
            name="parentFolderId"
            class="border-dark-gray border rounded-lg ml-2"
            value={searchParams.folderId ?? undefined}
          >
            <option value="">None</option>
            {data()?.map((folder) => (
              <option value={folder.id}>{folder.name}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          class="px-3 py-2 bg-blue text-white rounded-lg mt-2"
        >
          Create Folder
        </button>
      </div>
    </Form>
  )
}
