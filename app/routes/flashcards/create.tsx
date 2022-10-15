import React from 'react'
import { Form, useLoaderData } from '@remix-run/react'
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from '@remix-run/server-runtime'
import { requireUserEmail } from '~/session.server'
import { db } from '~/utils/db.server'
import { Prisma } from '@prisma/client'

export const action: ActionFunction = async ({ request }) => {
  const email = await requireUserEmail(request)

  const body = new URLSearchParams(await request.text())

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

  await db.flashcard.create({
    data: {
      front,
      back,
      folder: { connect: { id: folderId } },
      author: { connect: { email } },
      backDescription,
      backImage,
      frontDescription,
      frontImage,
      randomSideAllowed,
    },
  })

  return redirect('/flashcards')
}

export const loader: LoaderFunction = async () => {
  const folders = await db.folder.findMany()
  return json<Prisma.FolderGetPayload<{}>[]>(folders)
}

export default function CreateFlashcard() {
  const data = useLoaderData<Prisma.FolderGetPayload<{}>[]>()
  return (
    <Form method="post">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>
              Front
              <input type="text" name="front" />
            </label>
            <label>
              Front description
              <input type="text" name="frontDescription" />
            </label>
            <label>
              Front image
              <input type="text" name="frontImage" />
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>
              Back
              <input type="text" name="back" />
            </label>

            <label>
              Back description
              <input type="text" name="backDescription" />
            </label>

            <label>
              Back image
              <input type="text" name="backImage" />
            </label>
          </div>
        </div>
        <label>
          Folder
          <select name="folderId">
            {data.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Random side allowed
          <input type="checkbox" name="randomSideAllowed" />
        </label>
        <input type="submit" />
      </div>
    </Form>
  )
}
