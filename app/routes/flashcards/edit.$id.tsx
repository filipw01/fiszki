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
import { getFolderPath } from '~/utils.server'

export const action: ActionFunction = async ({ request, params }) => {
  const email = await requireUserEmail(request)
  const body = new URLSearchParams(await request.text())
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
    const backImage = body.get('backImage')
    const frontDescription = body.get('frontDescription')
    const frontImage = body.get('frontImage')
    const randomSideAllowed = body.get('randomSideAllowed') ? true : false

    if (!front || !back || !folderId) {
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
        backImage,
        frontDescription,
        frontImage,
        randomSideAllowed,
      },
    })
    return redirect('/flashcards')
  } else if (action === 'delete') {
    await db.flashcard.delete({ where: { id: params.id } })
    return redirect('/flashcards')
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

  const foldersWithMappedName = folders.map((folder) => {
    return {
      ...folder,
      name: getFolderPath(folder.id, folders),
    }
  })

  return json<LoaderData>({ folders: foldersWithMappedName, tags, flashcard })
}

export default function EditFlashcard() {
  const { flashcard, folders, tags } = useLoaderData<LoaderData>()

  return (
    <div>
      <Form method="post">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label>
                Front
                <input
                  type="text"
                  name="front"
                  defaultValue={flashcard.front}
                />
              </label>
              <label>
                Front description
                <input
                  type="text"
                  name="frontDescription"
                  defaultValue={flashcard.frontDescription ?? undefined}
                />
              </label>
              <label>
                Front image
                <input
                  type="text"
                  name="frontImage"
                  defaultValue={flashcard.frontImage ?? undefined}
                />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label>
                Back
                <input type="text" name="back" defaultValue={flashcard.back} />
              </label>
              <label>
                Back description
                <input
                  type="text"
                  name="backDescription"
                  defaultValue={flashcard.backDescription ?? undefined}
                />
              </label>
              <label>
                Back image
                <input
                  type="text"
                  name="backImage"
                  defaultValue={flashcard.backImage ?? undefined}
                />
              </label>
            </div>
          </div>
          <label>
            Random side allowed
            <input
              type="checkbox"
              name="randomSideAllowed"
              defaultChecked={flashcard.randomSideAllowed}
            />
          </label>
          <label>
            Folder
            <select name="folderId">
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
            Tags
            <select
              name="tags"
              multiple
              defaultValue={flashcard.tags.map((tag) => tag.id)}
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" name="action" value="update">
            Save
          </button>
        </div>
      </Form>
      <Form method="post">
        <button type="submit" name="action" value="delete">
          Delete
        </button>
      </Form>
    </div>
  )
}
