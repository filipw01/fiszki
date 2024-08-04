import { requireUserEmail } from '~/server/session.server'
import { getFolderNamePath, parseForm } from '~/utils.server'
import { Input } from '~/components/base/Input'
import { db } from '~/db/db.server'
import { folderForm } from '~/schemas/folder'
import {
  useSearchParams,
  redirect,
  cache,
  createAsync,
  useSubmission,
  action,
} from '@solidjs/router'
import { For } from 'solid-js'

const routeData = cache(async () => {
  'use server'

  const email = await requireUserEmail()
  const folders = await db.folder.findMany({ where: { owner: { email } } })
  return folders
    .map((folder) => {
      return {
        ...folder,
        name: getFolderNamePath(folder.id, folders),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}, 'flashcards-folder-create')

const createFolder = action(async (form: FormData) => {
  'use server'

  const email = await requireUserEmail()

  const { data } = folderForm.safeParse(parseForm(form))
  if (!data) {
    return new Error('Wrong data format')
  }
  const { name, color, parentFolderId } = data

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
    parentFolderId ? `/flashcards/folder/${parentFolderId}` : `/flashcards`,
  )
}, 'create-folder')

export default function CreateFolder() {
  const data = createAsync(() => routeData())
  const [searchParams] = useSearchParams()
  const isCreating = useSubmission(createFolder)
  return (
    <form action={createFolder} method="post">
      {isCreating.pending && <div>Creating...</div>}
      {isCreating.result && <div>{isCreating.result.message}</div>}
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
          >
            <option value="">None</option>
            <For each={data()}>
              {(folder) => (
                <option
                  value={folder.id}
                  selected={searchParams.folderId === folder.id}
                >
                  {folder.name}
                </option>
              )}
            </For>
          </select>
        </label>
        <button
          type="submit"
          class="px-3 py-2 bg-blue text-white rounded-lg mt-2"
        >
          Create Folder
        </button>
      </div>
    </form>
  )
}
