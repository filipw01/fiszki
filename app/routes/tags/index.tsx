import React from 'react'
import { Link, useLoaderData } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { json, LoaderFunction } from '@remix-run/server-runtime'
import { Prisma } from '@prisma/client'
import { requireUserEmail } from '~/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  const tags = await db.tag.findMany({ where: { owner: { email } } })

  return json<Prisma.TagGetPayload<{}>[]>(tags)
}

export default function Tags() {
  const data = useLoaderData<Prisma.TagGetPayload<{}>[]>()

  return (
    <div>
      <Link to="create">Create new tag</Link>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {data.map((tag) => (
          <Link
            to={`edit/${tag.id}`}
            key={tag.id}
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100px',
              padding: '4px',
              background: tag.color,
              border: '1px solid black',
              borderRadius: '8px',
            }}
          >
            <p>{tag.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
