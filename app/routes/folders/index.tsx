import React from 'react'
import { Link, useLoaderData } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { json, LoaderFunction } from '@remix-run/server-runtime'
import { Prisma } from '@prisma/client'
import { requireUserEmail } from '~/session.server'
import { Folder } from '~/components/Folder'

export const loader: LoaderFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  const folders = await db.folder.findMany({
    where: { owner: { email }, parentFolder: null },
  })

  return json<Prisma.FolderGetPayload<{}>[]>(folders)
}

export default function Folders() {
  const data = useLoaderData<Prisma.FolderGetPayload<{}>[]>()

  return (
    <div className="p-8">
      <Link to="create">Create new folder</Link>
      <div className="flex flex-wrap gap-1">
        {data.map((folder) => (
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
