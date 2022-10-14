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

export const action: ActionFunction = async ({ request, params }) => {
  const body = new URLSearchParams(await request.text())
  const action = body.get('action')

  if (action === 'update') {
    const front = body.get('front')
    const back = body.get('back')
    const folderId = body.get('folderId')
    const backDescription = body.get('backDescription')
    const backImage = body.get('backImage')
    const frontDescription = body.get('frontDescription')
    const frontImage = body.get('frontImage')
    const randomSideAllowed = body.get('randomSideAllowed') ? true : false

    if (!front || !back || !folderId) {
      return new Response('Missing data', { status: 400 })
    }

    return await db.flashcard.update({
      where: {
        id: params.id,
      },
      data: {
        front,
        back,
        folder: { connect: { id: folderId } },
        backDescription,
        backImage,
        frontDescription,
        frontImage,
        randomSideAllowed,
      },
    })
  } else if (action === 'delete') {
    await db.flashcard.delete({ where: { id: params.id } })
    return redirect('/flashcards')
  }
}

export const loader: LoaderFunction = async ({ params }) => {
  const folders = await db.folder.findMany()
  const flashcard = await db.flashcard.findUnique({
    where: { id: params.id },
  })

  if (!flashcard) {
    return new Response('Not found', { status: 404 })
  }

  return json<{
    flashcard: Prisma.FlashcardGetPayload<{}>
    folders: Prisma.FolderGetPayload<{}>[]
  }>({ flashcard, folders })
}

export default function EditFlashcard() {
  const { flashcard, folders } = useLoaderData<{
    flashcard: Prisma.FlashcardGetPayload<{}>
    folders: Prisma.FolderGetPayload<{}>[]
  }>()

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
