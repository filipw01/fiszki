import { useParams } from 'react-router'
import { useMatches } from '@remix-run/react'
import { Flashcard as FlashcardType, studyAction, Tag } from '~/utils.server'
import { ActionFunction } from '@remix-run/server-runtime'
import { Study } from '~/components/Study'
import { seededShuffle } from '~/utils'

export const action: ActionFunction = studyAction

export default function Set() {
  const { number } = useParams()
  const [, { data }] = useMatches()
  const { flashcards: allFlashcards, tags } = data as {
    flashcards: FlashcardType[]
    tags: Tag[]
  }

  const flashcards = seededShuffle(
    allFlashcards.filter(
      (flashcard) =>
        flashcard.nextStudy === new Date().toISOString().slice(0, 10)
    )
  )
    .sort((flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen)
    .slice((Number(number) - 1) * FLASHCARDS_PER_SET)

  return <Study flashcards={flashcards} tags={tags} isSet />
}

const FLASHCARDS_PER_SET = 10
