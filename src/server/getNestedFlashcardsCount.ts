import { Prisma } from '@prisma/client'
import { db } from '~/db/db.server'

export async function getNestedFlashcardsCount(
  folder: Prisma.FolderGetPayload<{}>,
  email: string,
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
