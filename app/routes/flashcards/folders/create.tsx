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
import { getFolderPath, isNonEmptyString, isString } from '~/utils.server'
import { Input } from '~/components/Input'

export const action: ActionFunction = async ({ request }) => {
  const email = await requireUserEmail(request)

  const body = await request.formData()

  const name = body.get('name')
  const color = body.get('color')
  const parentFolderId = body.get('parentFolderId')

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(color) ||
    !isString(parentFolderId)
  ) {
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
  return redirect(
    parentFolderId
      ? `/flashcards/folders/${parentFolderId}`
      : `/flashcards/folders`
  )
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
  const [searchParams] = useSearchParams()
  return (
    <Form method="post">
      <div className="flex flex-col p-8 gap-2">
        <Input name="name" label="Name" />
        <label className="flex">
          Color
          <input
            type="color"
            name="color"
            defaultValue="#1982C4"
            className="w-full ml-2"
          />
        </label>
        <label>
          Parent folder
          <select
            key={searchParams.get('folderId')}
            name="parentFolderId"
            className="border-dark-gray border rounded-lg ml-2"
            defaultValue={searchParams.get('folderId') ?? undefined}
          >
            <option value="">None</option>
            {data.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="px-3 py-2 bg-blue text-white rounded-lg mt-2"
        >
          Create Folder
        </button>
      </div>
    </Form>
  )
}
