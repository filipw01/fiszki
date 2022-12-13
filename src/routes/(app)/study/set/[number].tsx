import { partition } from 'lodash-es'
import { Study } from '~/components/Study'
import { seededShuffle } from '~/utils'
import { flashcardsServerData } from '~/routes/(app)/index'
import { useParams, useRouteData } from 'solid-start'
import { createMemo } from 'solid-js'

export const routeData = () => flashcardsServerData()

export default function Set() {
  const params = useParams()
  const data = useRouteData<typeof routeData>()

  const flashcardsSetToStudy = createMemo(() => {
    const flashcards = seededShuffle(
      data()?.flashcards.filter(
        (flashcard) =>
          flashcard.nextStudy === new Date().toISOString().slice(0, 10)
      ) ?? []
    ).sort(
      (flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen
    )

    const [seenFlashcards, notSeenFlashcards] = partition(
      flashcards,
      (flashcard) => flashcard.lastSeen > 0
    )
    const flashcardsToStudy =
      notSeenFlashcards.length > 0 ? notSeenFlashcards : seenFlashcards
    return flashcardsToStudy.slice(
      (Number(params.number) - 1) * FLASHCARDS_PER_SET,
      Number(params.number) * FLASHCARDS_PER_SET
    )
  })

  return <Study flashcards={flashcardsSetToStudy()} isSet />
}

const FLASHCARDS_PER_SET = 10
