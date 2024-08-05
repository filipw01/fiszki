import * as v from 'valibot'
import { requireUserEmail } from '~/server/session.server'
import { getFolderNamePath, parseForm } from '~/utils.server'
import { Textarea } from '~/components/base/Textarea'
import { db } from '~/db/db.server'
import {
  useSearchParams,
  redirect,
  cache,
  createAsync,
  action,
  useSubmission,
} from '@solidjs/router'
import { uploadImageToS3 } from '~/db/uploadHandler.server'
import { For } from 'solid-js'

const routeData = cache(async () => {
  'use server'

  const email = await requireUserEmail()
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
        name: getFolderNamePath(folder.id, folders),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return { folders: foldersWithMappedName, tags }
}, 'flashcards-create')

const parseFlashcardsForm = (form: FormData) => {
  const supportedLocales = ['en-GB', 'en-US', 'ko-KR', 'es-ES'] as const

  const frontSchema = v.union([
    v.object({
      frontImage: v.pipe(
        v.any(),
        v.check((file) => file.size > 0),
      ),
      front: v.string(),
    }),
    v.object({
      frontImage: v.pipe(
        v.any(),
        v.check((file) => file.size === 0),
      ),
      front: v.pipe(v.string(), v.minLength(1)),
    }),
  ])

  const backSchema = v.union([
    v.object({
      backImage: v.pipe(
        v.any(),
        v.check((file) => file.size > 0),
      ),
      back: v.string(),
    }),
    v.object({
      backImage: v.pipe(
        v.any(),
        v.check((file) => file.size === 0),
      ),
      back: v.pipe(v.string(), v.minLength(1)),
    }),
  ])

  const restSchema = v.object({
    folderId: v.string(),
    tags: v.union([
      v.optional(v.array(v.pipe(v.string(), v.minLength(1))), []),
      v.pipe(v.string(), v.minLength(1)),
    ]),
    randomSideAllowed: v.optional(v.literal('on')),
    frontLanguage: v.picklist(supportedLocales),
    backLanguage: v.picklist(supportedLocales),
    frontDescription: v.string(),
    backDescription: v.string(),
  })

  try {
    const { front, frontImage } = v.parse(frontSchema, parseForm(form))
    const { back, backImage } = v.parse(backSchema, parseForm(form))
    const {
      tags: tagsOrTag,
      randomSideAllowed,
      folderId,
      frontLanguage,
      backLanguage,
      frontDescription,
      backDescription,
    } = v.parse(restSchema, parseForm(form))

    return {
      front,
      frontImage,
      back,
      backImage,
      tagsOrTag,
      randomSideAllowed,
      folderId,
      frontLanguage,
      backLanguage,
      frontDescription,
      backDescription,
    }
  } catch (e) {
    return new Error('Invalid form data', { cause: e })
  }
}

const createFlashcard = action(async (form: FormData) => {
  'use server'

  const result = parseFlashcardsForm(form)
  if (result instanceof Error) {
    return result
  }
  const {
    front,
    frontImage,
    back,
    backImage,
    tagsOrTag,
    randomSideAllowed,
    folderId,
    frontLanguage,
    backLanguage,
    frontDescription,
    backDescription,
  } = result

  const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

  const email = await requireUserEmail()

  const tags = Array.isArray(tagsOrTag) ? tagsOrTag : [tagsOrTag]

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
      frontLanguage,
      backLanguage,
      frontDescription,
      backDescription,
      frontImage: frontImageUrl,
      backImage: backImageUrl,
      randomSideAllowed: randomSideAllowed === 'on',
      folder: { connect: { id: folderId } },
      owner: { connect: { email } },
      tags: { connect: tags.map((id) => ({ id })) },
      lastSeen: new Date(Date.now() - ONE_DAY_IN_MS),
    },
  })

  return redirect(`/flashcards/folder/${folderId}`)
})

const supportedLocales = ['en-GB', 'en-US', 'ko-KR', 'es-ES'] as const

export default function CreateFlashcard() {
  const data = createAsync(() => routeData())
  const [searchParams] = useSearchParams()

  const isCreating = useSubmission(createFlashcard)

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
    <form enctype="multipart/form-data" action={createFlashcard} method="post">
      {isCreating.pending && <div>Creating...</div>}
      {isCreating.result && <div>{isCreating.result.message}</div>}
      <div class="flex flex-col gap-2">
        <div class="flex gap-4">
          <div class="flex flex-col flex-grow">
            <Textarea name="front" label="Front" />
            <Textarea name="frontDescription" label="Front description" />
            <label>
              Front image
              <input type="file" name="frontImage" />
            </label>
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
                          false /* TODO: Add default selected based on folder default language */
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
            <Textarea name="back" label="Back" />
            <Textarea name="backDescription" label="Back description" />
            <label>
              Back image
              <input type="file" name="backImage" />
            </label>
            <label>
              Back language
              <select
                name="backLanguage"
                class="border border-dark-gray rounded-lg ml-2"
              >
                <For each={availableLocales}>
                  {(locale) => {
                    return (
                      <option selected={false} value={locale.value}>
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
    </form>
  )
}
