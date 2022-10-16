import { useParams } from 'react-router'
import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/server-runtime'
import { useMatches } from '@remix-run/react'
import { Flashcard as FlashcardType, studyAction } from '~/utils.server'
import { Study } from '~/components/Study'
import { daysFromNow, seededShuffle } from '~/utils'
import { requireUserEmail } from '~/session.server'

export const action: ActionFunction = studyAction

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - dzień ${params.date}` }
}

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserEmail(request)
  return null
}

export default function RepeatFlashcards() {
  const { date } = useParams()
  const [, { data }] = useMatches()
  const { flashcards: allFlashcards } = data as {
    flashcards: FlashcardType[]
  }

  const isoDateToday = daysFromNow(0)
  const flashcards =
    date === isoDateToday
      ? allFlashcards.filter(
          (flashcard) =>
            new Date(flashcard.nextStudy).getTime() <=
            new Date(isoDateToday).getTime()
        )
      : allFlashcards.filter((flashcard) => {
          return flashcard.nextStudy === date
        })

  const shuffledFlashcards = seededShuffle(flashcards).sort(
    (flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen
  )

  return <Study flashcards={shuffledFlashcards} />
}
