import React from 'react'
import { Link, useLoaderData } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { json, LoaderFunction } from '@remix-run/server-runtime'
import { Prisma } from '@prisma/client'
import { requireUserEmail } from '~/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  const flashcards = await db.flashcard.findMany({
    where: { owner: { email } },
  })

  return json<Prisma.FlashcardGetPayload<{}>[]>(flashcards)
}

export default function Flashcards() {
  const data = useLoaderData<Prisma.FlashcardGetPayload<{}>[]>()

  return (
    <div className="flex flex-wrap gap-1">
      {data.map((flashcard) => (
        <Link
          to={`/flashcards/edit/${flashcard.id}`}
          key={flashcard.id}
          style={{
            width: '200px',
            padding: '4px',
            border: '1px solid black',
            borderRadius: '8px',
          }}
        >
          <p>{flashcard.front}</p>
          <br />
          <p>{flashcard.back}</p>
        </Link>
      ))}
    </div>
  )
}
