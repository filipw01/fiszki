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
import {
  getFolderPath,
  isString,
  isStringArray,
  isStringOrNull,
} from '~/utils.server'
import {
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from '@remix-run/node'
import { uploadToS3 } from '~/uploadHandler.server'

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

export const action: ActionFunction = async ({ request }) => {
  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, data, contentType, ...rest }) => {
      if (
        !['frontImage', 'backImage'].includes(name) ||
        !contentType.startsWith('image/')
      ) {
        return undefined
      }
      return await uploadToS3(data, contentType)
    },
    unstable_createMemoryUploadHandler({
      filter: ({ name }) => !['frontImage', 'backImage'].includes(name),
    })
  )

  const email = await requireUserEmail(request)
  const formData = await unstable_parseMultipartFormData(request, uploadHandler)

  const front = formData.get('front')
  const back = formData.get('back')
  const folderId = formData.get('folderId')
  const tags = formData.getAll('tags')
  const backDescription = formData.get('backDescription')
  const backImage = formData.get('backImage')
  const frontDescription = formData.get('frontDescription')
  const frontImage = formData.get('frontImage')
  const randomSideAllowed = Boolean(formData.get('randomSideAllowed'))

  if (
    !isString(front) ||
    !isString(back) ||
    !isString(folderId) ||
    !isStringArray(tags) ||
    !isStringOrNull(backDescription) ||
    !isStringOrNull(backImage) ||
    !isStringOrNull(frontDescription) ||
    !isStringOrNull(frontImage)
  ) {
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
    <Form method="post" encType="multipart/form-data">
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
              <input type="file" name="frontImage" />
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
              <input type="file" name="backImage" />
            </label>
          </div>
        </div>
        <label>
          Folder
          <select
            name="folderId"
            defaultValue={searchParams.get('folderId') ?? undefined}
          >
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
