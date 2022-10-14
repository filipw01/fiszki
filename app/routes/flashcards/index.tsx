import React from 'react'
import { Link, useLoaderData } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { json } from '@remix-run/server-runtime'
import { Prisma } from '@prisma/client'

export const loader = async () => {
  const flashcards = await db.flashcard.findMany()

  return json<Prisma.FlashcardGetPayload<{}>[]>(flashcards)
}

export default function Flashcards() {
  const data = useLoaderData<Prisma.FlashcardGetPayload<{}>[]>()

  return (
    <div>
      <Link to="create">Create</Link>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {data.map((flashcard) => (
          <Link
            to={`edit/${flashcard.id}`}
            key={flashcard.id}
            style={{
              display: 'block',
              width: '100px',
              background: 'gray',
              border: '1px solid black',
            }}
          >
            <p>{flashcard.front}</p>
            <p>{flashcard.back}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
