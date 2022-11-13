import React from 'react'
import { Form, useLoaderData, useSearchParams } from '@remix-run/react'
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from '@remix-run/server-runtime'
import { requireUserEmail } from '~/session.server'
import { db } from '~/utils/db.server'
import { Prisma } from '@prisma/client'
import { getFolderPath } from '~/utils.server'

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

export const action: ActionFunction = async ({ request }) => {
  const email = await requireUserEmail(request)

  const body = new URLSearchParams(await request.text())

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

  await db.flashcard.create({
    data: {
      front,
      back,
      folder: { connect: { id: folderId } },
      owner: { connect: { email } },
      tags: { connect: tags.map((id) => ({ id })) },
      backDescription,
      backImage,
      frontDescription,
      frontImage,
      randomSideAllowed,
      lastSeen: new Date(Date.now() - ONE_DAY_IN_MS),
    },
  })

  return redirect('/flashcards')
}

type LoaderData = {
  folders: Prisma.FolderGetPayload<{}>[]
  tags: Prisma.TagGetPayload<{}>[]
}

export const loader: LoaderFunction = async ({ request }) => {
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

  return json<LoaderData>({ folders: foldersWithMappedName, tags })
}

export default function CreateFlashcard() {
  const { folders, tags } = useLoaderData<LoaderData>()
  const [searchParams] = useSearchParams()
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
          <select name="folderId" defaultValue={searchParams.get('folderId') ?? undefined}>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tags
          <select name="tags" multiple>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
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
