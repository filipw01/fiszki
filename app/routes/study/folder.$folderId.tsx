import React, { useState } from 'react'
import { json, LoaderFunction, MetaFunction } from '@remix-run/server-runtime'
import { styled } from '~/styles/stitches.config'
import { Link, useLoaderData, useLocation } from '@remix-run/react'
import { Flashcard as FlashcardType, mapFlashcard } from '~/utils.server'
import { Flashcard } from '~/components/Flashcard'
import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'
import { Prisma } from '@prisma/client'
import { Folder } from '~/components/Folder'
import { FoldersContainer } from '~/routes/study/tag'

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - tag ${params['*']}` }
}

type LoaderData = {
  flashcards: FlashcardType[]
  folderName: string
  subfolders: (Prisma.FolderGetPayload<{}> & {
    _count: { flashcards: number; folders: number }
  })[]
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const email = await requireUserEmail(request)

  // TODO: separate tag and folder routes
  const folder = await db.folder.findFirst({
    where: {
      id: params.folderId,
      owner: { email },
    },
    include: {
      flashcards: {
        include: {
          folder: true,
          tags: true,
        },
      },
      folders: {
        include: {
          _count: {
            select: {
              flashcards: true,
              folders: true,
            },
          },
        },
      },
    },
  })
  const folders = await db.folder.findMany({})
  if (!folder) {
    throw new Response('Not found', { status: 404 })
  }

  return json<LoaderData>({
    flashcards: folder.flashcards.map((tag) => mapFlashcard(tag, folders)),
    folderName: folder.name,
    subfolders: folder.folders,
  })
}

export default function Subfolder() {
  const { flashcards, folderName, subfolders } = useLoaderData<LoaderData>()
  return (
    <div>
      <h1>Folder {folderName}</h1>
      {/*<Link to={upUrl}>Up</Link>*/}
      <FoldersContainer>
        {subfolders.map(({ id, color, _count, name }) => (
          <Folder
            key={id}
            nameLink={`/study/folder/${id}`}
            studyLink={`/study/study-tag/${id}`}
            name={name}
            count={_count.folders + _count.flashcards}
            color={color}
          />
        ))}
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

const FlashcardsContainer = styled('div', {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
})
