import { Study } from '~/components/Study'
import { useRouteData } from 'solid-start'
import { createServerData$, redirect } from 'solid-start/server'
import { requireUserEmail } from '~/session.server'
import { db } from '~/db/db.server'
import { mapFlashcard } from '~/utils.server'
import { createEffect } from 'solid-js'

export const routeData = () =>
  createServerData$(async (_, event) => {
    const email = await requireUserEmail(event.request)
    const learningSession = await db.learningSession.findUnique({
      where: {
        ownerEmail: email,
      },
      include: {
        uncompletedFlashcards: {
          orderBy: {
            learningSessionSortingIndex: 'asc',
          },
          include: {
            folder: true,
            tags: true,
          },
        },
        _count: {
          select: {
            completedFlashcards: true,
          },
        },
      },
    })
    const folders = await db.folder.findMany({
      where: { owner: { email } },
    })
    if (learningSession === null) throw redirect('/')
    return learningSession.uncompletedFlashcards.map((flashcard) =>
      mapFlashcard(flashcard, folders)
    )
  })

export default function LearningSession() {
  const data = useRouteData<typeof routeData>()

  return <Study flashcards={data() ?? []} />
}
