import { requireUserEmail } from '~/session.server'
import {
  getFolderPath,
  isNonEmptyString,
  isNonEmptyStringArray,
  isString,
} from '~/utils.server'
import { Textarea } from '~/components/base/Textarea'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'
import { db } from '~/db/db.server'
import { FormError, useRouteData, useSearchParams } from 'solid-start'
import { uploadImageToS3 } from '~/db/uploadHandler.server'

export const routeData = () =>
  createServerData$(async (_, { request }) => {
    const email = await requireUserEmail(request)
    const folders = await db.folder.findMany({
      where: { owner: { email } },
    })
    const tags = await db.tag.findMany({
      where: { owner: { email } },
    })
    const foldersWithMappedName = folders
      .map((folder) => {
        return {
          ...folder,
          name: getFolderPath(folder.id, folders),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return { folders: foldersWithMappedName, tags }
  })

const isFile = (input: FormDataEntryValue | null): input is File =>
  typeof input !== 'string'
const isFileOrNull = (input: FormDataEntryValue | null): input is File | null =>
  input === null || isFile(input)

export default function CreateFlashcard() {
  const data = useRouteData<typeof routeData>()
  const [searchParams] = useSearchParams()

  const [isCreating, { Form }] = createServerAction$(
    async (form: FormData, { request }) => {
      const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

      const email = await requireUserEmail(request)

      const front = form.get('front')
      const back = form.get('back')
      const folderId = form.get('folderId')
      const tags = form.getAll('tags')
      const backDescription = form.get('backDescription')
      const backImage = form.get('backImage')
      const frontDescription = form.get('frontDescription')
      const frontImage = form.get('frontImage')
      const randomSideAllowed = Boolean(form.get('randomSideAllowed'))

      if (
        (!isNonEmptyString(front) && !isFile(frontImage)) ||
        (!isNonEmptyString(back) && !isFile(backImage)) ||
        !isNonEmptyString(folderId) ||
        !isNonEmptyStringArray(tags) ||
        !isString(front) ||
        !isString(back) ||
        !isString(backDescription) ||
        !isString(frontDescription) ||
        !isFileOrNull(backImage) ||
        !isFileOrNull(frontImage)
      ) {
        return new FormError('Missing data')
      }

      const ownedTags = await db.tag.findMany({
        where: {
          id: {
            in: tags,
          },
          owner: {
            email,
          },
        },
      })
      if (ownedTags.length !== tags.length) {
        return new Error('You need to own all tags you try to assign')
      }

      const [frontImageUrl, backImageUrl] = await Promise.all([
        uploadImageToS3(frontImage),
        uploadImageToS3(backImage),
      ])

      await db.flashcard.create({
        data: {
          front,
          back,
          folder: { connect: { id: folderId } },
          owner: { connect: { email } },
          tags: { connect: tags.map((id) => ({ id })) },
          backDescription,
          backImage: backImageUrl,
          frontDescription,
          frontImage: frontImageUrl,
          randomSideAllowed,
          lastSeen: new Date(Date.now() - ONE_DAY_IN_MS),
        },
      })

      return redirect(`/flashcards/folder/${folderId}`)
    }
  )

  return (
    <Form enctype="multipart/form-data">
      {isCreating.pending && <div>Creating...</div>}
      {isCreating.error && <div>{isCreating.error.message}</div>}
      <div class="flex flex-col gap-2">
        <div class="flex gap-4">
          <div class="flex flex-col flex-grow">
            <Textarea name="front" label="Front" />
            <Textarea name="frontDescription" label="Front description" />
            <label>
              Front image
              <input type="file" name="frontImage" />
            </label>
          </div>
          <div class="flex flex-col flex-grow">
            <Textarea name="back" label="Back" />
            <Textarea name="backDescription" label="Back description" />
            <label>
              Back image
              <input type="file" name="backImage" />
            </label>
          </div>
        </div>
        <label>
          Random side allowed
          <input type="checkbox" name="randomSideAllowed" />
        </label>
        <label>
          Folder
          <select
            name="folderId"
            class="border border-dark-gray rounded-lg ml-2"
          >
            {data()?.folders.map((folder) => (
              <option
                selected={searchParams.folderId === folder.id}
                value={folder.id}
              >
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>Tags</div>
          <select
            name="tags"
            multiple
            class="border border-dark-gray rounded-lg"
          >
            {data()?.tags.map((tag) => (
              <option value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" class="px-3 py-2 bg-blue text-white rounded-lg">
          Create Flashcard
        </button>
      </div>
    </Form>
  )
}
