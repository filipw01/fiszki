import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'
import { json, LoaderFunction } from '@remix-run/server-runtime'
import { Prisma } from '@prisma/client'
import { Link, useLoaderData } from '@remix-run/react'
import { Folder } from '~/components/Folder'
import React from 'react'

type LoaderData = {
  folders: Prisma.FolderGetPayload<{}>[]
  parentFolder: string | null
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const email = await requireUserEmail(request)
  const folder = await db.folder.findUnique({
    where: { id: params.folderId },
  })
  if (!folder || folder.ownerEmail !== email) {
    throw new Response('Not found', { status: 404 })
  }
  const folders = await db.folder.findMany({
    where: {
      parentFolderId: params.folderId,
      owner: { email },
    },
    include: {
      _count: {
        select: {
          folders: true,
          flashcards: true,
        },
      },
    },
  })

  return json<LoaderData>({ folders, parentFolder: folder.parentFolderId })
}

export default function Subfolder() {
  const { folders, parentFolder } = useLoaderData<LoaderData>()

  return (
    <div className="p-8">
      <Link to="/folders/create">Create new folder</Link>
      <br />
      <Link to={parentFolder ? `/folders/${parentFolder}` : `/folders`}>
        Go up
      </Link>
      <div className="flex flex-wrap gap-1">
        {folders.map((folder) => (
          <div key={folder.id} className="flex flex-col items-center">
            <Folder
              name={folder.name}
              color={folder.color}
              nameLink={`/folders/${folder.id}`}
            />
            <Link to={`/folders/edit/${folder.id}`}>edit</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
