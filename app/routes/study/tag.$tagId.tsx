import React, { useState } from 'react'
import { json, LoaderFunction, MetaFunction } from '@remix-run/server-runtime'
import { styled } from '~/styles/stitches.config'
import { Link, useLoaderData, useLocation } from '@remix-run/react'
import { Flashcard as FlashcardType, mapFlashcard, Tag } from '~/utils.server'
import { Flashcard } from '~/components/Flashcard'
import { Folder } from '~/components/Folder'
import { db } from '~/utils/db.server'
import { useParams } from 'react-router'
import { requireUserEmail } from '~/session.server'

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - tag ${params['*']}` }
}

type LoaderData = {
  flashcards: FlashcardType[]
  tagName: string
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const email = await requireUserEmail(request)

  // TODO: separate tag and folder routes
  const tag = await db.tag.findFirst({
    where: {
      id: params.tagId,
      owner: { email },
    },
    include: {
      flashcards: {
        include: {
          folder: true,
          tags: true,
        },
      },
    },
  })
  const folders = await db.folder.findMany({})
  if (!tag) {
    throw new Response('Not found', { status: 404 })
  }

  return json<LoaderData>({
    flashcards: tag.flashcards.map((tag) => mapFlashcard(tag, folders)),
    tagName: tag.name,
  })
}

export default function Tag() {
  const { flashcards, tagName } = useLoaderData<LoaderData>()
  const params = useParams()
  const location = useLocation()
  const upUrl = location.pathname.split('/').slice(0, -1).join('/')
  return (
    <div>
      <h1>Tag {tagName}</h1>
      <Link to={upUrl}>Up</Link>
      <FlashcardsContainer>
        {flashcards.map((flashcard) => {
          return <TurnableFlashcard key={flashcard.id} flashcard={flashcard} />
        })}
      </FlashcardsContainer>
    </div>
  )
}

const TurnableFlashcard = ({ flashcard }: { flashcard: FlashcardType }) => {
  const [isFront, setIsFront] = useState(true)
  const turn = () => setIsFront((prev) => !prev)
  return isFront ? (
    <Flashcard
      onClick={turn}
      text={flashcard.front}
      example={flashcard.frontDescription}
      image={flashcard.frontImage}
      tags={flashcard.tags}
    />
  ) : (
    <Flashcard
      onClick={turn}
      text={flashcard.back}
      image={flashcard.backImage}
      example={flashcard.backDescription}
      tags={flashcard.tags}
    />
  )
}

const FlashcardsContainer = styled('div', {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
})
