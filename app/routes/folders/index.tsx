import React from 'react'
import { Link, useLoaderData } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { json, LoaderFunction } from '@remix-run/server-runtime'
import { Prisma } from '@prisma/client'
import { requireUserEmail } from '~/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  const folders = await db.folder.findMany({ where: { owner: { email } } })

  return json<Prisma.FolderGetPayload<{}>[]>(folders)
}

export default function Folders() {
  const data = useLoaderData<Prisma.FolderGetPayload<{}>[]>()

  return (
    <div>
      <Link to="create">Create</Link>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {data.map((folder) => (
          <Link
            to={`edit/${folder.id}`}
            key={folder.id}
            style={{
              display: 'block',
              width: '100px',
              background: 'gray',
              border: '1px solid black',
            }}
          >
            <p>{folder.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
