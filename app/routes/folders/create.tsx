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
import { getFolderPath } from '~/utils.server'

export const action: ActionFunction = async ({ request }) => {
  const email = await requireUserEmail(request)

  const body = new URLSearchParams(await request.text())

  const name = body.get('name')
  const color = body.get('color')
  const parentFolderId = body.get('parentFolderId')

  if (!name || !color) {
    return new Response('Missing data', { status: 400 })
  }

  if (parentFolderId) {
    db.folder.findFirstOrThrow({
      where: {
        id: parentFolderId,
        owner: { email },
      },
    })
  }

  await db.folder.create({
    data: {
      name,
      color,
      owner: { connect: { email } },
      parentFolder: parentFolderId
        ? { connect: { id: parentFolderId } }
        : undefined,
    },
  })
  return redirect('/folders')
}

export const loader: LoaderFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  const folders = await db.folder.findMany({ where: { owner: { email } } })
  const foldersWithMappedName = folders
    .map((folder) => {
      return {
        ...folder,
        name: getFolderPath(folder.id, folders),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return json<Prisma.FolderGetPayload<{}>[]>(foldersWithMappedName)
}

export default function CreateFolder() {
  const data = useLoaderData<Prisma.FolderGetPayload<{}>[]>()
  return (
    <Form method="post">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label>
          Name
          <input type="text" name="name" />
        </label>
        <label>
          Color
          <input type="color" name="color" defaultValue="#1982C4" />
        </label>
        <label>
          Parent folder
          <select name="parentFolderId">
            <option value="">None</option>
            {data.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Create</button>
      </div>
    </Form>
  )
}
