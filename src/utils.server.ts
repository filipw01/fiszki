import { daysFromNow } from './utils'
import { db } from '~/db/db.server'
import { Prisma } from '@prisma/client'

export interface Flashcard {
  id: string
  front: string
  frontImage?: string | null
  frontDescription?: string | null
  back: string
  backImage?: string | null
  backDescription?: string | null
  folder: string
  tags: Tag[]
  randomSideAllowed: boolean
  streak: number
  nextStudy: string
  lastSeen: number
}

export interface Tag {
  id: string
  name: string
  color: {
    r: number
    g: number
    b: number
  }
}

const getTags = async (email: string): Promise<Tag[]> => {
  return (
    await db.tag.findMany({
      where: { flashcards: { every: { owner: { email } } } },
    })
  ).map(mapTag)
}

const getFlashcards = async (email: string): Promise<Flashcard[]> => {
  const folders = await db.folder.findMany({
    where: { owner: { email } },
  })
  const flashcards = await db.flashcard.findMany({
    where: {
      owner: {
        email,
      },
    },
    include: {
      folder: true,
      tags: true,
    },
  })
  return flashcards.map((flashcard) => mapFlashcard(flashcard, folders))
}

export function mapFlashcard(
  {
    folderId,
    ownerEmail: _,
    nextStudy,
    lastSeen,
    folder,
    tags,
    ...other
  }: Prisma.FlashcardGetPayload<{
    include: { folder: true; tags: true }
  }>,
  folders: Prisma.FolderGetPayload<{}>[]
): Flashcard {
  const folderPath = getFolderPath(folderId, folders)
  return {
    ...other,
    nextStudy: nextStudy.toISOString().slice(0, 10),
    lastSeen: lastSeen.getTime(),
    folder: folderPath,
    tags: tags.map(mapTag),
  }
}

export function getFolderPath(
  folderId: string,
  folders: Prisma.FolderGetPayload<{}>[]
) {
  let nextFolderId: string | null = folderId
  const folderPath = []
  while (nextFolderId) {
    const folder = folders.find((folder) => folder.id === nextFolderId)
    if (!folder) {
      throw new Error('Folder not found')
    }
    folderPath.unshift(folder.name)
    nextFolderId = folder.parentFolderId
  }
  return folderPath.join('/')
}

export function mapTag(tag: Prisma.TagGetPayload<{}>): Tag {
  return {
    id: tag.id,
    name: tag.name,
    color: {
      r: parseInt(tag.color.slice(1, 3), 16),
      g: parseInt(tag.color.slice(3, 5), 16),
      b: parseInt(tag.color.slice(5, 7), 16),
    },
  }
}

export const indexLoader = async (email: string) => {
  const [flashcards, tags] = await Promise.all([
    getFlashcards(email),
    getTags(email),
  ])

  return { flashcards, tags }
}

export const actionSuccess = async (
  flashcardId: string,
  ownerEmail: string
) => {
  const flashcard = await db.flashcard.findUnique({
    where: {
      id: flashcardId,
    },
  })
  if (!flashcard) {
    throw new Error('Flashcard not found')
  }
  const number = getNumberOfDays(flashcard.streak)
  await db.learningSession.update({
    where: {
      ownerEmail,
    },
    data: {
      completedFlashcards: { connect: { id: flashcardId } },
      uncompletedFlashcards: { disconnect: { id: flashcardId } },
    },
  })
  await db.flashcard.update({
    where: {
      id: flashcardId,
    },
    data: {
      streak: {
        increment: 1,
      },
      nextStudy: new Date(daysFromNow(number)),
      lastSeen: new Date(),
    },
  })
}

export const actionFailure = async (flashcardId: string) => {
  await db.flashcard.update({
    where: {
      id: flashcardId,
    },
    data: {
      streak: 0,
      lastSeen: new Date(),
    },
  })
}

const randomNumber = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

const getNumberOfDays = (hotStreak: number) => {
  switch (hotStreak) {
    case 0:
      return 3
    case 1:
      return randomNumber(6, 8)
    case 2:
      return randomNumber(18, 23)
    case 3:
      return randomNumber(85, 100)
    default:
      return 99999
  }
}

export const isNonEmptyString = (input: unknown): input is string =>
  typeof input === 'string' && input.length > 0

export const isNonEmptyStringArray = (input: unknown): input is string[] =>
  Array.isArray(input) && input.every(isNonEmptyString)

export const isString = (input: unknown): input is string =>
  typeof input === 'string'
