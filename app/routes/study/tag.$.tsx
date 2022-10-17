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
  folders: { name: string; id: string; color: string }[]
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const email = await requireUserEmail(request)
  const tagName = params['*']?.split('/').slice(-1)[0]
  // TODO: separate tag and folder routes
  const tag = await db.tag.findFirst({
    where: {
      name: tagName,
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
  if (tag) {
    return json<LoaderData>({
      flashcards: tag.flashcards.map(mapFlashcard),
      folders: [],
    })
  }
  const folder = await db.folder.findFirst({
    where: {
      name: tagName,
      owner: { email },
    },
    include: {
      flashcards: {
        include: {
          folder: true,
          tags: true,
        },
      },
      folders: true,
    },
  })
  if (!folder) {
    throw new Response('Not found', { status: 404 })
  }
  return json<LoaderData>({
    flashcards: folder.flashcards.map(mapFlashcard),
    folders: folder.folders.map((folder) => ({
      name: folder.name,
      color: folder.color,
      id: folder.id,
    })),
  })
}

export default function Tag() {
  const { flashcards, folders } = useLoaderData<LoaderData>()
  const params = useParams()
  const path = params['*'] as string
  const location = useLocation()
  const upUrl = location.pathname.split('/').slice(0, -1).join('/')
  return (
    <div>
      <h1>Tag {path}</h1>
      <Link to={upUrl}>Up</Link>
      <FoldersContainer>
        {folders.map(({ name, id, color }) => {
          return (
            <div key={id}>
              <Folder
                nameLink={`${path}/${name}`}
                studyLink={`/study/study-tag/${path}/${name}`}
                name={name}
                count={0 /*implement*/}
                color={color}
              />
            </div>
          )
        })}
      </FoldersContainer>
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

export const FoldersContainer = styled('div', {
  display: 'grid',
  gap: '1rem',
  margin: '1rem 0',
  gridTemplateColumns: 'repeat(auto-fill, minmax(122px, 1fr))',
})

const FlashcardsContainer = styled('div', {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
})
