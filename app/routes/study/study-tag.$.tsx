import { MetaFunction } from '@remix-run/server-runtime'
import { useParams } from 'react-router'
import { useMatches } from '@remix-run/react'
import { Flashcard as FlashcardType, Tag } from '~/utils.server'
import { seededShuffle } from '~/utils'
import { Study } from '~/components/Study'

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - study tag ${params['*']}` }
}

export default function StudyTag() {
  const params = useParams()
  const path = params['*'] as string
  const [, { data }] = useMatches()
  const { flashcards: allFlashcards, tags } = data as {
    flashcards: FlashcardType[]
    tags: Tag[]
  }

  const flashcardsInFolder = allFlashcards.filter(
    (flashcard) =>
      flashcard.folder.startsWith(path) || flashcard.tags.includes(path)
  )

  const flashcards = seededShuffle(flashcardsInFolder).sort(
    (flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen
  )

  return <Study flashcards={flashcards} tags={tags} />
}
