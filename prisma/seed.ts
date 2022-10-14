import { PrismaClient, type Prisma } from '@prisma/client'
import { register } from '~/session.server'

const db = new PrismaClient()

async function seed() {
  const user1 = await register({
    email: 'test@test.com',
    password: 'test',
  })
  const user2 = await register({
    email: 'test2@test.com',
    password: 'test',
  })
  const tagNames = (
    await Promise.all(
      getTags().map((tag) => {
        return db.tag.create({ data: tag })
      })
    )
  ).map((tag) => tag.name)

  const folder = await db.folder.create({
    data: {
      name: 'Movies',
      color: '#34ebff',
      folders: {
        createMany: {
          data: [
            {
              name: 'The Godfather',
              color: '#b90d0d',
            },
            {
              name: 'Dark',
              color: '#ffd500',
            },
          ],
        },
      },
    },
  })
  await Promise.all(
    getFlashcards({
      folderId: folder.id,
      authorEmail: user1.email,
      tagNames,
    }).map((flashcard) => {
      return db.flashcard.create({ data: flashcard })
    })
  )
}

seed()

function getTags(): Prisma.TagCreateInput[] {
  return [
    { name: 'English', color: '#0000ff' },
    { name: 'Spanish', color: '#ff0000' },
  ]
}

function getFlashcards({
  folderId,
  authorEmail,
  tagNames,
}: {
  folderId: string
  authorEmail: string
  tagNames: string[]
}): Prisma.FlashcardCreateInput[] {
  return [
    {
      front: 'skóra',
      back: 'el cuero',
      folder: {
        connect: {
          id: folderId,
        },
      },
      author: {
        connect: {
          email: authorEmail,
        },
      },
      streak: 0,
      nextStudy: new Date(),
      lastSeen: new Date(),
      randomSideAllowed: false,
      tags: {
        connect: tagNames.map((name) => ({ name })),
      },
    },
  ]
}
