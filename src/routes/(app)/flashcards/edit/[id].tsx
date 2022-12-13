import { requireUserEmail } from '~/session.server'
import {
  getFolderPath,
  isNonEmptyString,
  isNonEmptyStringArray,
  isString,
} from '~/utils.server'
import { Textarea } from '~/components/Textarea'
import { db } from '~/db/db.server'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'
import { RouteDataArgs, useParams, useRouteData } from 'solid-start'
import { deleteFromS3, s3Url } from '~/db/uploadHandler.server'
import { createMemo } from 'solid-js'
// import { deleteFromS3, s3Url } from '~/uploadHandler.server'

export const routeData = ({ params }: RouteDataArgs) =>
  createServerData$(
    async ([, flashcardId], { request }) => {
      const email = await requireUserEmail(request)
      const folders = await db.folder.findMany({
        where: { owner: { email } },
      })
      const tags = await db.tag.findMany({
        where: { owner: { email } },
      })
      const flashcard = await db.flashcard.findFirstOrThrow({
        where: { id: flashcardId, owner: { email } },
        include: { tags: true },
      })

      if (!flashcard) {
        throw new Error('Not found')
      }

      const foldersWithMappedName = folders
        .map((folder) => {
          return {
            ...folder,
            name: getFolderPath(folder.id, folders),
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))

      return { folders: foldersWithMappedName, tags, flashcard }
    },
    { key: () => ['flashcard', params.id] }
  )

export default function EditFlashcard() {
  const data = useRouteData<typeof routeData>()
  const params = useParams()

  const [isEditing, { Form }] = createServerAction$(
    async (form: FormData, { request }) => {
      const email = await requireUserEmail(request)
      const action = form.get('action')
      const id = form.get('id')
      if (!isNonEmptyString(id)) throw new Error('Missing data')

      await db.flashcard.findFirstOrThrow({
        where: { id, owner: { email } },
      })

      if (action === 'update') {
        const front = form.get('front')
        const back = form.get('back')
        const folderId = form.get('folderId')
        const tags = form.getAll('tags')
        const backDescription = form.get('backDescription')
        const frontDescription = form.get('frontDescription')
        const randomSideAllowed = Boolean(form.get('randomSideAllowed'))

        if (
          !isNonEmptyString(front) ||
          !isNonEmptyString(back) ||
          !isNonEmptyString(folderId) ||
          !isNonEmptyStringArray(tags) ||
          !isString(backDescription) ||
          !isString(frontDescription)
        ) {
          throw new Error('Missing data')
        }

        await db.folder.findFirstOrThrow({
          where: {
            id: folderId,
            owner: { email },
          },
        })

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
          throw new Error('You need to own all tags you try to assign')
        }

        await db.flashcard.update({
          where: {
            id,
          },
          data: {
            front,
            back,
            folder: { connect: { id: folderId } },
            tags: { set: tags.map((id) => ({ id })) },
            backDescription,
            frontDescription,
            randomSideAllowed,
          },
        })
        return redirect(`/flashcards/folder/${folderId}`)
      } else if (action === 'delete') {
        const flashcard = await db.flashcard.delete({
          where: { id },
        })
        await Promise.all(
          [flashcard.backImage, flashcard.frontImage].map((image) => {
            if (isNonEmptyString(image) && image.startsWith(`${s3Url}/`)) {
              const key = image.replace(`${s3Url}/`, '')
              return deleteFromS3(key)
            }
          })
        )
        return redirect(`/flashcards/folder/${flashcard.folderId}`)
      }
    }
  )
  const tagIds = createMemo(() => data()?.flashcard.tags.map((tag) => tag.id))
  return (
    <div>
      {isEditing.pending && <div>Updating...</div>}
      {isEditing.error && <div>{isEditing.error.message}</div>}
      <Form>
        <input type="hidden" name="id" value={params.id} />
        <div class="flex flex-col gap-2">
          <div class="flex gap-4">
            <div class="flex flex-col flex-grow">
              <Textarea
                label="Front"
                name="front"
                value={data()?.flashcard.front}
              />
              <Textarea
                label="Front description"
                name="frontDescription"
                value={data()?.flashcard.frontDescription}
              />
            </div>
            <div class="flex flex-col flex-grow">
              <Textarea
                label="Back"
                name="back"
                value={data()?.flashcard.back}
              />
              <Textarea
                label="Back description"
                name="backDescription"
                value={data()?.flashcard.backDescription}
              />
            </div>
          </div>
          <label>
            <input
              class="mr-2"
              type="checkbox"
              name="randomSideAllowed"
              checked={data()?.flashcard.randomSideAllowed}
            />
            Random side allowed
          </label>
          <label>
            Folder
            <select
              name="folderId"
              class="border border-dark-gray rounded-lg ml-2"
            >
              {data()?.folders.map((folder) => (
                <option
                  value={folder.id}
                  selected={folder.id === data()?.flashcard.folderId}
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
                <option selected={tagIds()?.includes(tag.id)} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            name="action"
            value="update"
            class="px-3 py-2 bg-blue text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </Form>
      <Form method="post" class="flex flex-col mt-8 gap-2">
        <label>
          <input type="checkbox" required class="mr-2" />I confirm that I want
          to delete this flashcard
        </label>
        <button
          type="submit"
          name="action"
          value="delete"
          class="px-3 py-2 bg-red-500 text-white rounded-lg"
        >
          Delete
        </button>
      </Form>
    </div>
  )
}