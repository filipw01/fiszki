import { daysFromNow } from './utils'
import { db } from '~/db/db.server'
import { Prisma } from '@prisma/client'

export interface Flashcard {
  id: string
  front: string
  frontImage?: string | null
  frontDescription?: string | null
  frontLanguage: string
  back: string
  backImage?: string | null
  backDescription?: string | null
  backLanguage: string
  folder: { id: string; path: string }
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
  const folderPath = getFolderNamePath(folderId, folders)
  return {
    ...other,
    nextStudy: nextStudy.toISOString().slice(0, 10),
    lastSeen: lastSeen.getTime(),
    folder: { id: folderId, path: folderPath },
    tags: tags.map(mapTag),
  }
}

export function getFolderNamePath(
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
    folderPath.unshift(folder)
    nextFolderId = folder.parentFolderId
  }
  return folderPath
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

export const actionFailure = async (
  flashcardId: string,
  ownerEmail: string
) => {
  await Promise.all([
    db.learningSession.update({
      where: {
        ownerEmail,
      },
      data: {
        completedFlashcards: { connect: { id: flashcardId } },
        uncompletedFlashcards: { disconnect: { id: flashcardId } },
      },
    }),
    db.flashcard.update({
      where: {
        id: flashcardId,
      },
      data: {
        streak: 0,
        lastSeen: new Date(),
      },
    }),
  ])
}

const randomNumber = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

const getNumberOfDays = (hotStreak: number) => {
  switch (hotStreak) {
    case 0:
      return randomNumber(3, 4)
    case 1:
      return randomNumber(9, 12)
    case 2:
      return randomNumber(25, 31)
    case 3:
      return randomNumber(85, 100)
    default:
      return 99999
  }
}

export const isNonEmptyString = (input: unknown): input is string =>
  typeof input === 'string' && input.length > 0

export const parseForm = (form: FormData) => {
  const data: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {}
  for (const [key, value] of form.entries()) {
    if (!data[key]) {
      data[key] = value
    } else {
      const dataValue = data[key]
      if (Array.isArray(dataValue)) {
        dataValue.push(value)
      } else {
        data[key] = [dataValue, value]
      }
    }
  }
  return data
}
