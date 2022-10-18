import { ActionFunction, json, LoaderFunction } from '@remix-run/server-runtime'
import { google, sheets_v4 } from 'googleapis'
import { isEqual } from 'lodash-es'
import { daysFromNow } from './utils'
import Sheets = sheets_v4.Sheets
import { db } from '~/utils/db.server'
import { Prisma } from '@prisma/client'
import { requireUserEmail } from '~/session.server'

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
  name: string
  color: {
    r: number
    g: number
    b: number
  }
}

const getRange = (from: string, to?: string, sheet = 'Fiszki') => {
  if (process.env.NODE_ENV === 'development') {
    const originalColumnFrom = from.charCodeAt(0)
    const offsetColumnFrom = String.fromCharCode(originalColumnFrom + 15)
    const baseRange = `${sheet}!${offsetColumnFrom}${from.slice(1)}`
    if (!to) {
      return baseRange
    }
    const originalColumnTo = to.charCodeAt(0)
    const offsetColumnTo = String.fromCharCode(originalColumnTo + 15)
    return `${baseRange}:${offsetColumnTo}${to.slice(1)}`
  }
  const toRange = to ? `:${to}` : ''
  return `${sheet}!${from}${toRange}`
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

function getFolderPath(
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

  return json({ flashcards, tags })
}

const actionSuccess = async (flashcardId: string) => {
  const flashcard = await db.flashcard.findUnique({
    where: {
      id: flashcardId,
    },
  })
  if (!flashcard) {
    throw new Error('Flashcard not found')
  }
  const number = getNumberOfDays(flashcard.streak)
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

const actionFailure = async (flashcardId: string) => {
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

export const studyAction: ActionFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  const body = await request.formData()
  const rawFlashcardId = body.get('flashcardId')
  const id = typeof rawFlashcardId === 'string' ? rawFlashcardId : null
  const action = body.get('_action')
  if (id !== null) {
    db.flashcard.findFirstOrThrow({
      where: {
        id,
        owner: {
          email,
        },
      },
    })
    if (action === 'success') {
      await actionSuccess(id)
    }
    if (action === 'failure') {
      await actionFailure(id)
    }
  }
  return null
}
