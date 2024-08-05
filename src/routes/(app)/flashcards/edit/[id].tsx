import { requireUserEmail } from '~/server/session.server'
import { getFolderNamePath, isNonEmptyString, parseForm } from '~/utils.server'
import { Textarea } from '~/components/base/Textarea'
import { db } from '~/db/db.server'
import {
  useParams,
  redirect,
  action,
  createAsync,
  useSubmission,
  cache,
} from '@solidjs/router'
import { createMemo, For } from 'solid-js'
import * as v from 'valibot'
import { deleteFlashcard } from '~/flashcard.server'

const supportedLocales = ['en-GB', 'en-US', 'ko-KR', 'es-ES'] as const

const routeData = cache(async (flashcardId: string) => {
  'use server'

  const email = await requireUserEmail()
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
        name: getFolderNamePath(folder.id, folders),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return { folders: foldersWithMappedName, tags, flashcard }
}, 'flashcard-edit-id')

const editFlashcard = action(async (form: FormData) => {
  'use server'

  const supportedLocales = ['en-GB', 'en-US', 'ko-KR', 'es-ES'] as const

  const email = await requireUserEmail()
  const action = form.get('action')
  const id = form.get('id')
  if (!isNonEmptyString(id)) {
    return new Error('Missing data')
  }

  await db.flashcard.findFirstOrThrow({
    where: { id, owner: { email } },
  })

  if (action === 'update') {
    const parsingResult = v.safeParse(
      v.object({
        front: v.pipe(v.string(), v.minLength(1)),
        back: v.pipe(v.string(), v.minLength(1)),
        frontLanguage: v.picklist(supportedLocales),
        backLanguage: v.picklist(supportedLocales),
        folderId: v.pipe(v.string(), v.minLength(1)),
        tags: v.union([
          v.optional(v.array(v.pipe(v.string(), v.minLength(1))), []),
          v.pipe(v.string(), v.minLength(1)),
        ]),
        backDescription: v.string(),
        frontDescription: v.string(),
        randomSideAllowed: v.optional(v.literal('on')),
      }),
      parseForm(form),
    )
    if (!parsingResult.success) {
      return new Error('Wrong data format')
    }
    const {
      backDescription,
      backLanguage,
      frontDescription,
      frontLanguage,
      front,
      back,
      randomSideAllowed,
      folderId,
      tags: tagsOrTag,
    } = parsingResult.output

    const tags = Array.isArray(tagsOrTag) ? tagsOrTag : [tagsOrTag]

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
      return new Error('You need to own all tags you try to assign')
    }

    await db.flashcard.update({
      where: {
        id,
      },
      data: {
        front,
        back,
        frontDescription,
        backDescription,
        frontLanguage,
        backLanguage,
        randomSideAllowed: randomSideAllowed === 'on',
        folder: { connect: { id: folderId } },
        tags: { set: tags.map((id) => ({ id })) },
      },
    })
    return redirect(`/flashcards/folder/${folderId}`)
  } else if (action === 'delete') {
    const flashcard = await deleteFlashcard(id)
    return redirect(`/flashcards/folder/${flashcard.folderId}`)
  }
}, 'edit-flashcard')

export default function EditFlashcard() {
  const params = useParams()
  const data = createAsync(() => routeData(params.id))

  const isEditing = useSubmission(editFlashcard)
  const tagIds = createMemo(() => data()?.flashcard.tags.map((tag) => tag.id))

  const formatter = new Intl.DisplayNames('en-US', {
    type: 'language',
    languageDisplay: 'standard',
  })
  const availableLocales = supportedLocales.map((baseName) => {
    return {
      value: baseName,
      label: formatter.of(baseName),
    }
  })

  return (
    <div>
      {isEditing.pending && <div>Updating...</div>}
      {isEditing.result && <div>{isEditing.result.message}</div>}
      <form method="post" action={editFlashcard}>
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
              <label>
                Front language
                <select
                  name="frontLanguage"
                  class="border border-dark-gray rounded-lg ml-2"
                >
                  <For each={availableLocales}>
                    {(locale) => {
                      return (
                        <option
                          selected={
                            data()?.flashcard.frontLanguage === locale.value
                          }
                          value={locale.value}
                        >
                          {locale.label}
                        </option>
                      )
                    }}
                  </For>
                </select>
              </label>
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
              <label>
                Back language
                <select
                  name="backLanguage"
                  class="border border-dark-gray rounded-lg ml-2"
                >
                  <For each={availableLocales}>
                    {(locale) => {
                      return (
                        <option
                          selected={
                            data()?.flashcard.backLanguage === locale.value
                          }
                          value={locale.value}
                        >
                          {locale.label}
                        </option>
                      )
                    }}
                  </For>
                </select>
              </label>
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
      </form>
      <form
        action={editFlashcard}
        method="post"
        class="flex flex-col mt-8 gap-2"
      >
        <input type="hidden" name="id" value={params.id} />
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
      </form>
    </div>
  )
}
