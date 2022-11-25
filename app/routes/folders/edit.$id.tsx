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
import { useParams } from 'react-router'
import { requireUserEmail } from '~/session.server'
import { getFolderPath, isNonEmptyString, isString } from '~/utils.server'
import { Input } from '~/components/Input'

export const action: ActionFunction = async ({ request, params }) => {
  const email = await requireUserEmail(request)
  const body = await request.formData()
  const action = body.get('action')

  await db.folder.findFirstOrThrow({
    where: {
      id: params.id,
      owner: { email },
    },
  })

  if (action === 'update') {
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
      await db.folder.findFirstOrThrow({
        where: {
          id: parentFolderId,
          owner: { email },
        },
      })
    }

    await db.folder.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        color,
        parentFolder: parentFolderId
          ? { connect: { id: parentFolderId } }
          : { disconnect: true },
      },
    })
    return redirect('/folders')
  } else if (action === 'delete') {
    const folder = await db.folder.findFirst({
      where: {
        id: params.id,
        owner: { email },
      },
      include: {
        folders: true,
        flashcards: true,
      },
    })
    if (!folder) {
      throw new Response('Folder not found', { status: 404 })
    }
    if (folder.folders.length > 0 || folder.flashcards.length > 0) {
      throw new Response('Folder not empty', { status: 400 })
    }
    await db.folder.delete({ where: { id: params.id } })
    return redirect('/folders')
  }
}

export const loader: LoaderFunction = async ({ request, params }) => {
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

  return json<{
    folders: Prisma.FolderGetPayload<{}>[]
    editedFolder: Prisma.FolderGetPayload<{}>
  }>({
    folders: foldersWithMappedName,
    editedFolder: folders.find((folder) => folder.id === params.id)!,
  })
}

export default function EditFolder() {
  const params = useParams()
  const { folders, editedFolder } = useLoaderData<{
    folders: Prisma.FolderGetPayload<{}>[]
    editedFolder: Prisma.FolderGetPayload<{}>
  }>()

  return (
    <div className="flex flex-col p-8">
      <Form method="post">
        <div className="flex flex-col gap-2">
          <Input name="name" label="Name" defaultValue={editedFolder?.name} />
          <label className="flex">
            Color
            <input
              type="color"
              name="color"
              defaultValue={editedFolder?.color}
              className="w-full ml-2"
            />
          </label>
          <label>
            Parent folder
            <select
              name="parentFolderId"
              className="border-dark-gray border rounded-lg ml-2"
              defaultValue={editedFolder?.parentFolderId ?? undefined}
            >
              <option value="">None</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            name="action"
            value="update"
            className="px-3 py-2 bg-blue text-white rounded-lg mt-2"
          >
            Save
          </button>
        </div>
      </Form>
      <Form method="post" className="flex flex-col mt-8 gap-2">
        <label>
          <input type="checkbox" required className="mr-2" />I confirm that I
          want to delete this folder
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
