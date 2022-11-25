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
    <div className="p-8">
      <Link to="create">Create new tag</Link>
      <div className="flex flex-wrap gap-2">
        {data.map((tag) => (
          <Link
            to={`edit/${tag.id}`}
            key={tag.id}
            className="grid place-items-center w-72 p-1 border border-dark-gray rounded-lg"
            style={{ background: tag.color }}
          >
            <p className="text-white">{tag.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
