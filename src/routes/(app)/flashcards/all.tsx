import { requireUserEmail } from '~/server/session.server'
import { db } from '~/db/db.server'
import { cache, createAsync } from '@solidjs/router'

const routeData = cache(async () => {
  'use server'
  const email = await requireUserEmail()
  return await db.flashcard.findMany({
    where: { owner: { email } },
  })
}, 'flashcards-all')

export default function Flashcards() {
  const data = createAsync(() => routeData())

  return (
    <div class="flex flex-wrap gap-1">
      {data()?.map((flashcard) => (
        <a
          href={`/flashcards/edit/${flashcard.id}`}
          style={{
            width: '200px',
            padding: '4px',
            border: '1px solid black',
            'border-radius': '8px',
          }}
        >
          <p>{flashcard.front}</p>
          <br />
          <p>{flashcard.back}</p>
        </a>
      ))}
    </div>
  )
}
