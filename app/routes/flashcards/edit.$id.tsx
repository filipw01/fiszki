import React from 'react'
import { Form, useLoaderData } from '@remix-run/react'
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from '@remix-run/server-runtime'
import { db } from '~/utils/db.server'
import { Prisma } from '@prisma/client'
import { requireUserEmail } from '~/session.server'
import {
  getFolderPath,
  isNonEmptyString,
  isNonEmptyStringArray,
  isString,
} from '~/utils.server'
import { Textarea } from '~/components/Textarea'
import { deleteFromS3, s3Url } from '~/uploadHandler.server'

export const action: ActionFunction = async ({ request, params }) => {
  const email = await requireUserEmail(request)
  const body = await request.formData()
  const action = body.get('action')

  await db.flashcard.findFirstOrThrow({
    where: { id: params.id, owner: { email } },
  })

  if (action === 'update') {
    const front = body.get('front')
    const back = body.get('back')
    const folderId = body.get('folderId')
    const tags = body.getAll('tags')
    const backDescription = body.get('backDescription')
    const frontDescription = body.get('frontDescription')
    const randomSideAllowed = Boolean(body.get('randomSideAllowed'))

    if (
      !isNonEmptyString(front) ||
      !isNonEmptyString(back) ||
      !isNonEmptyString(folderId) ||
      !isNonEmptyStringArray(tags) ||
      !isString(backDescription) ||
      !isString(frontDescription)
    ) {
      return new Response('Missing data', { status: 400 })
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
      return new Response('You need to own all tags you try to assign', {
        status: 400,
      })
    }

    await db.flashcard.update({
      where: {
        id: params.id,
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
    const flashcard = await db.flashcard.delete({ where: { id: params.id } })
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

type LoaderData = {
  flashcard: Prisma.FlashcardGetPayload<{ include: { tags: true } }>
  folders: Prisma.FolderGetPayload<{}>[]
  tags: Prisma.TagGetPayload<{}>[]
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const email = await requireUserEmail(request)
  const folders = await db.folder.findMany({
    where: { owner: { email } },
  })
  const tags = await db.tag.findMany({
    where: { owner: { email } },
  })
  const flashcard = await db.flashcard.findFirstOrThrow({
    where: { id: params.id, owner: { email } },
    include: { tags: true },
  })

  if (!flashcard) {
    return new Response('Not found', { status: 404 })
  }

  const foldersWithMappedName = folders
    .map((folder) => {
      return {
        ...folder,
        name: getFolderPath(folder.id, folders),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return json<LoaderData>({ folders: foldersWithMappedName, tags, flashcard })
}

export default function EditFlashcard() {
  const { flashcard, folders, tags } = useLoaderData<LoaderData>()

  return (
    <div>
      <Form method="post">
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <div className="flex flex-col flex-grow">
              <Textarea
                label="Front"
                name="front"
                defaultValue={flashcard.front}
              />
              <Textarea
                label="Front description"
                name="frontDescription"
                defaultValue={flashcard.frontDescription}
              />
            </div>
            <div className="flex flex-col flex-grow">
              <Textarea
                label="Back"
                name="back"
                defaultValue={flashcard.back}
              />
              <Textarea
                label="Back description"
                name="backDescription"
                defaultValue={flashcard.backDescription}
              />
            </div>
          </div>
          <label>
            <input
              className="mr-2"
              type="checkbox"
              name="randomSideAllowed"
              defaultChecked={flashcard.randomSideAllowed}
            />
            Random side allowed
          </label>
          <label>
            Folder
            <select
              name="folderId"
              className="border border-dark-gray rounded-lg ml-2"
            >
              {folders.map((folder) => (
                <option
                  key={folder.id}
                  value={folder.id}
                  selected={folder.id === flashcard.folderId}
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
              defaultValue={flashcard.tags.map((tag) => tag.id)}
              className="border border-dark-gray rounded-lg"
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            name="action"
            value="update"
            className="px-3 py-2 bg-blue text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </Form>
      <Form method="post" className="flex flex-col mt-8 gap-2">
        <label>
          <input type="checkbox" required className="mr-2" />I confirm that I
          want to delete this flashcard
        </label>
        <button
          type="submit"
          name="action"
          value="delete"
          className="px-3 py-2 bg-red-500 text-white rounded-lg"
        >
          Delete
        </button>
      </Form>
    </div>
  )
}
