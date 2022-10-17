import React from 'react'
import { Link, useLoaderData } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { json, LoaderFunction } from '@remix-run/server-runtime'
import { Prisma } from '@prisma/client'
import { requireUserEmail } from '~/session.server'
import { Folder } from '~/components/Folder'

export const loader: LoaderFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  const folders = await db.folder.findMany({ where: { owner: { email } } })

  return json<Prisma.FolderGetPayload<{}>[]>(folders)
}

export default function Folders() {
  const data = useLoaderData<Prisma.FolderGetPayload<{}>[]>()

  return (
    <div>
      <Link to="create">Create new folder</Link>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {data.map((folder) => (
          <Folder
            name={folder.name}
            color={folder.color}
            nameLink={`edit/${folder.id}`}
            studyLink={''}
          />
        ))}
      </div>
    </div>
  )
}
