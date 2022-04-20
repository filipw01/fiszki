import { useParams } from 'react-router'
import { ActionFunction, MetaFunction } from '@remix-run/server-runtime'
import { useMatches } from '@remix-run/react'
import { Flashcard as FlashcardType, studyAction, Tag } from '~/utils.server'
import { Study } from '~/components/Study'
import { seededShuffle } from '~/utils'

export const action: ActionFunction = studyAction

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - dzień ${params.date}` }
}

export default function RepeatFlashcards() {
  const { date } = useParams()
  const [, { data }] = useMatches()
  const { flashcards: allFlashcards, tags } = data as {
    flashcards: FlashcardType[]
    tags: Tag[]
  }

  const flashcards = seededShuffle(
    allFlashcards.filter((flashcard) => flashcard.nextStudy === date)
  ).sort((flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen)

  return <Study flashcards={flashcards} tags={tags} />
}
