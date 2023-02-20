import { db } from '~/db/db.server'
import { daysFromNow } from '~/utils'

export const createLearningSession = async (
  email: string,
  dayNumber: number,
  foldersIds?: string[]
) => {
  const minDay = dayNumber > 0 ? new Date(daysFromNow(dayNumber)) : undefined
  const maxDay = new Date(daysFromNow(dayNumber + 1))
  const where = {
    ownerEmail: email,
    nextStudy: {
      gte: minDay,
      lt: maxDay,
    },
    folderId: foldersIds
      ? {
          in: foldersIds,
        }
      : undefined,
  }
  await db.flashcard.updateMany({
    where,
    data: {
      lastSeen: new Date(daysFromNow(dayNumber)),
    },
  })

  const flashcardsIds = await db.flashcard.findMany({
    where,
    select: { id: true },
  })

  await db.learningSession.upsert({
    where: {
      ownerEmail: email,
    },
    create: {
      ownerEmail: email,
      uncompletedFlashcards: {
        connect: flashcardsIds,
      },
    },
    update: {
      uncompletedFlashcards: {
        set: flashcardsIds,
      },
      completedFlashcards: { set: [] },
    },
  })
}
