import { mapFlashcard } from '~/utils.server'
import { seededShuffle } from '~/utils'
import { Study } from '~/components/Study'
import { requireUserEmail } from '~/session.server'
import { createServerData$ } from 'solid-start/server'
import { db } from '~/db/db.server'
import { RouteDataArgs, useRouteData } from 'solid-start'
import { createMemo } from 'solid-js'

export const routeData = ({ params }: RouteDataArgs) =>
  createServerData$(
    async ([, resourceName], { request }) => {
      const split = resourceName.split('/')
      const topLevelName = split[split.length - 1]
      const email = await requireUserEmail(request)
      const flashcards = await db.flashcard.findMany({
        where: {
          owner: { email },
          folder: {
            name: topLevelName,
            owner: { email },
          },
        },
        include: {
          folder: true,
          tags: true,
        },
      })
      // todo: fix or change this not working when there are multiple folders with the same name
      const folders = await db.folder.findMany({ where: { owner: { email } } })
      if (flashcards.length > 0) {
        return {
          flashcards: flashcards.map((flashcard) =>
            mapFlashcard(flashcard, folders)
          ),
        }
      }
      const tagFlashcards = await db.flashcard.findMany({
        where: {
          tags: {
            some: {
              name: topLevelName,
            },
          },
        },
        include: {
          folder: true,
          tags: true,
        },
      })
      if (!tagFlashcards) {
        throw new Error('Not found')
      }
      return {
        flashcards: tagFlashcards.map((flashcard) =>
          mapFlashcard(flashcard, folders)
        ),
      }
    },
    { key: ['study', params.resourceName] }
  )

export default function StudyTag() {
  const data = useRouteData<typeof routeData>()
  const shuffledFlashcards = createMemo(() =>
    seededShuffle(data()?.flashcards ?? []).sort(
      (flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen
    )
  )

  return <Study flashcards={shuffledFlashcards()} />
}
