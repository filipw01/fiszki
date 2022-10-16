import { useParams } from 'react-router'
import { useMatches } from '@remix-run/react'
import { partition } from 'lodash-es'
import { Flashcard as FlashcardType, studyAction } from '~/utils.server'
import { ActionFunction, LoaderFunction, MetaFunction } from '@remix-run/server-runtime'
import { Study } from '~/components/Study'
import { seededShuffle } from '~/utils'
import { requireUserEmail } from '~/session.server'

export const action: ActionFunction = studyAction

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - zestaw ${params.number}` }
}

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserEmail(request)
  return null
}

export default function Set() {
  const { number } = useParams()
  const [, { data }] = useMatches()
  const { flashcards: allFlashcards } = data as {
    flashcards: FlashcardType[]
  }

  const flashcards = seededShuffle(
    allFlashcards.filter(
      (flashcard) =>
        flashcard.nextStudy === new Date().toISOString().slice(0, 10)
    )
  ).sort((flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen)

  const [seenFlashcards, notSeenFlashcards] = partition(
    flashcards,
    (flashcard) => flashcard.lastSeen > 0
  )
  const flashcardsToStudy =
    notSeenFlashcards.length > 0 ? notSeenFlashcards : seenFlashcards
  const flashcardsSetToStudy = flashcardsToStudy.slice(
    (Number(number) - 1) * FLASHCARDS_PER_SET,
    Number(number) * FLASHCARDS_PER_SET
  )

  return <Study flashcards={flashcardsSetToStudy} isSet />
}

const FLASHCARDS_PER_SET = 10
