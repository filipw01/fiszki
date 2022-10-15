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
  await requireUserEmail(request)

  const body = new URLSearchParams(await request.text())

  const name = body.get('name')
  const color = body.get('color')
  const parentFolderId = body.get('parentFolderId')

  if (!name || !color) {
    return new Response('Missing data', { status: 400 })
  }

  await db.folder.create({
    data: {
      name,
      color,
      parentFolder: parentFolderId
        ? { connect: { id: parentFolderId } }
        : undefined,
    },
  })
  return redirect('/folders')
}

export const loader: LoaderFunction = async () => {
  const folders = await db.folder.findMany()
  return json<Prisma.FolderGetPayload<{}>[]>(folders)
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
          <input type="color" name="color" />
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