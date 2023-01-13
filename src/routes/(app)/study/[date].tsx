import { Study } from '~/components/Study'
import { daysFromNow, seededShuffle } from '~/utils'
import { useParams, useRouteData } from 'solid-start'
import { flashcardsServerData } from '~/routes/(app)/index'
import { createMemo } from 'solid-js'

export const routeData = () => flashcardsServerData()

export default function RepeatFlashcards() {
  const data = useRouteData<typeof routeData>()
  const params = useParams()

  const isoDateToday = daysFromNow(0)
  const flashcards = createMemo(() => {
    if (params.date === isoDateToday) {
      return data()?.flashcards.filter(
        (flashcard) =>
          new Date(flashcard.nextStudy).getTime() <=
          new Date(isoDateToday).getTime()
      )
    } else {
      return data()?.flashcards.filter((flashcard) => {
        return flashcard.nextStudy === params.date
      })
    }
  })

  const shuffledFlashcards = createMemo(() => {
    return seededShuffle(flashcards() ?? []).sort(
      (flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen
    )
  })

  return <Study flashcards={shuffledFlashcards()} />
}
