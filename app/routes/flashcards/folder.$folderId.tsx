import React, { useState } from 'react'
import { json, LoaderFunction, MetaFunction } from '@remix-run/server-runtime'
import { Link, useLoaderData } from '@remix-run/react'
import {
  Flashcard as FlashcardType,
  getFolderPath,
  mapFlashcard,
} from '~/utils.server'
import { Flashcard } from '~/components/Flashcard'
import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'
import { Prisma } from '@prisma/client'
import { Folder } from '~/components/Folder'
import { FoldersContainer } from '~/routes/study/tag'

export const meta: MetaFunction = () => {
  return { title: `Fiszki - folders` }
}

type LoaderData = {
  flashcards: FlashcardType[]
  folderName: string
  parentFolder: string | null
  subfolders: (Prisma.FolderGetPayload<{}> & {
    flashcardsCount: number
  })[]
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const email = await requireUserEmail(request)

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
      folders: true,
    },
  })
  const folders = await db.folder.findMany({ where: { owner: { email } } })
  if (!folder) {
    throw new Response('Not found', { status: 404 })
  }

  return json<LoaderData>({
    flashcards: folder.flashcards.map((tag) => mapFlashcard(tag, folders)),
    folderName: getFolderPath(folder.id, folders),
    parentFolder: folder.parentFolderId,
    subfolders: await Promise.all(
      folder.folders.map(async (folder) => ({
        ...folder,
        flashcardsCount: await getNestedFlashcardsCount(folder, email),
      }))
    ),
  })
}

export async function getNestedFlashcardsCount(
  folder: Prisma.FolderGetPayload<{}>,
  email: string
): Promise<number> {
  const folders = await db.folder.findMany({
    where: {
      id: folder.id,
      owner: { email },
    },
    include: {
      _count: {
        select: {
          flashcards: true,
        },
      },

      folders: true,
    },
  })
  let sum = 0
  for (const folder of folders) {
    sum += folder._count.flashcards
    for (const subfolder of folder.folders) {
      sum += await getNestedFlashcardsCount(subfolder, email)
    }
  }

  return sum
}

export default function Subfolder() {
  const { flashcards, folderName, subfolders, parentFolder } =
    useLoaderData<LoaderData>()
  return (
    <div>
      <h1>Folder {folderName}</h1>
      {parentFolder && (
        <Link to={`/flashcards/folder/${parentFolder}`}>Up</Link>
      )}
      <FoldersContainer>
        {subfolders.map(({ id, color, flashcardsCount, name }) => (
          <Folder
            key={id}
            nameLink={`/flashcards/folder/${id}`}
            studyLink={`/study/study-tag/${id}`}
            name={name}
            count={flashcardsCount}
            color={color}
          />
        ))}
      </FoldersContainer>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
      >
        {flashcards.map((flashcard) => {
          return <TurnableFlashcard key={flashcard.id} flashcard={flashcard} />
        })}
      </div>
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
      id={flashcard.id}
      isEditable
    />
  ) : (
    <Flashcard
      onClick={turn}
      text={flashcard.back}
      image={flashcard.backImage}
      example={flashcard.backDescription}
      tags={flashcard.tags}
      id={flashcard.id}
    />
  )
}
