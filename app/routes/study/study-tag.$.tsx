import { json, LoaderFunction, MetaFunction } from '@remix-run/server-runtime'
import { useLoaderData } from '@remix-run/react'
import { Flashcard as FlashcardType, mapFlashcard, Tag } from '~/utils.server'
import { seededShuffle } from '~/utils'
import { Study } from '~/components/Study'
import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - study tag ${params['*']}` }
}

type LoaderData = {
  flashcards: FlashcardType[]
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const email = await requireUserEmail(request)
  const tagName = params['*']?.split('/').slice(-1)[0]
  const flashcards = await db.flashcard.findMany({
    where: {
      owner: { email },
      folder: {
        name: tagName,
        owner: { email },
      },
    },
    include: {
      folder: true,
      tags: true,
    },
  })
  if (flashcards.length > 0) {
    return json<LoaderData>({ flashcards: flashcards.map(mapFlashcard) })
  }
  const tagFlashcards = await db.flashcard.findMany({
    where: {
      tags: {
        some: {
          name: tagName,
        },
      },
    },
    include: {
      folder: true,
      tags: true,
    },
  })
  if (!tagFlashcards) {
    throw new Response('Not found', { status: 404 })
  }
  return json<LoaderData>({ flashcards: tagFlashcards.map(mapFlashcard) })
}

export default function StudyTag() {
  const { flashcards } = useLoaderData<LoaderData>()

  const shuffledFlashcards = seededShuffle(flashcards).sort(
    (flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen
  )

  return <Study flashcards={shuffledFlashcards} />
}
