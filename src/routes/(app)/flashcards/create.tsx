import { requireUserEmail } from '~/session.server'
import { getFolderNamePath, parseForm } from '~/utils.server'
import { Textarea } from '~/components/base/Textarea'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'
import { db } from '~/db/db.server'
import { useRouteData, useSearchParams } from 'solid-start'
import { uploadImageToS3 } from '~/db/uploadHandler.server'
import { For } from 'solid-js'
import { z } from 'zod'

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
          name: getFolderNamePath(folder.id, folders),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return { folders: foldersWithMappedName, tags }
  })

export const supportedLocales = ['en-GB', 'en-US', 'ko-KR', 'es-ES'] as const

export default function CreateFlashcard() {
  const data = useRouteData<typeof routeData>()
  const [searchParams] = useSearchParams()

  const [isCreating, { Form }] = createServerAction$(
    async (form: FormData, { request }) => {
      const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

      const email = await requireUserEmail(request)

      const { front, frontImage } = z
        .object({
          frontImage: z.instanceof(File).refine((file) => file.size > 0),
          front: z.string(),
        })
        .or(
          z.object({
            frontImage: z.instanceof(File).refine((file) => file.size === 0),
            front: z.string().nonempty(),
          })
        )
        .parse(parseForm(form))

      const { back, backImage } = z
        .object({
          backImage: z.instanceof(File).refine((file) => file.size > 0),
          back: z.string(),
        })
        .or(
          z.object({
            backImage: z.instanceof(File).refine((file) => file.size === 0),
            back: z.string().nonempty(),
          })
        )
        .parse(parseForm(form))

      const {
        tags,
        randomSideAllowed,
        folderId,
        frontLanguage,
        backLanguage,
        frontDescription,
        backDescription,
      } = z
        .object({
          folderId: z.string(),
          tags: z.array(z.string().nonempty()).default([]),
          randomSideAllowed: z.boolean().optional(),
          frontLanguage: z.enum(supportedLocales),
          frontDescription: z.string(),
          backLanguage: z.enum(supportedLocales),
          backDescription: z.string(),
        })
        .parse(parseForm(form))

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
          randomSideAllowed,
          folder: { connect: { id: folderId } },
          owner: { connect: { email } },
          tags: { connect: tags.map((id) => ({ id })) },
          lastSeen: new Date(Date.now() - ONE_DAY_IN_MS),
        },
      })

      return redirect(`/flashcards/folder/${folderId}`)
    }
  )

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
    </Form>
  )
}
