import { Study } from '~/components/Study'
import { cache, createAsync, redirect } from '@solidjs/router'
import { requireUserEmail } from '~/server/session.server'
import { db } from '~/db/db.server'
import { mapFlashcard } from '~/utils.server'

const routeData = cache(async () => {
  'use server'

  const email = await requireUserEmail()
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
}, 'learningSession')

export default function LearningSession() {
  const data = createAsync(() => routeData())

  return <Study flashcards={data() ?? []} />
}
