import { requireUserEmail } from '~/session.server'
import { createServerData$ } from 'solid-start/server'
import { db } from '~/db/db.server'
import { A, useRouteData } from 'solid-start'

export const routeData = () =>
  createServerData$(async (_, { request }) => {
    const email = await requireUserEmail(request)
    return await db.flashcard.findMany({
      where: { owner: { email } },
    })
  })

export default function Flashcards() {
  const data = useRouteData<typeof routeData>()

  return (
    <div class="flex flex-wrap gap-1">
      {data()?.map((flashcard) => (
        <A
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
        </A>
      ))}
    </div>
  )
}
