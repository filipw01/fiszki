import { shuffle } from 'remeda'
import { db } from '~/db/db.server'
import { daysFromNow } from '~/utils'

export const createLearningSession = async (
  email: string,
  dayNumber: number,
  foldersIds?: string[],
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

  const flashcardsIds = await db.flashcard.findMany({
    where,
    select: { id: true },
  })

  const flashcardsIdsShuffled = shuffle(flashcardsIds)

  await db.$transaction([
    db.learningSession.upsert({
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
    }),
    ...flashcardsIdsShuffled.map((flashcard, index) => {
      return db.flashcard.update({
        where: {
          id: flashcard.id,
        },
        data: {
          learningSessionSortingIndex: index,
        },
      })
    }),
  ])
}
