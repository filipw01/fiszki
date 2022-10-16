import { PrismaClient, type Prisma } from '@prisma/client'
import { register } from '~/session.server'
import { use } from 'ast-types'

const db = new PrismaClient()

async function seed() {
  const user1 = await register({
    email: 'test@test.com',
    password: 'test',
  })
  const tagNames = (
    await Promise.all([
      db.tag.create({
        data: {
          name: 'English',
          color: '#0000ff',
          owner: { connect: { email: user1.email } },
        },
      }),
      db.tag.create({
        data: {
          name: 'Spanish',
          color: '#ff0000',
          owner: { connect: { email: user1.email } },
        },
      }),
    ])
  ).map((tag) => tag.name)

  const folder = await db.folder.create({
    data: {
      name: 'Movies',
      color: '#34ebff',
      ownerEmail: user1.email,
      folders: {
        createMany: {
          data: [
            {
              name: 'The Godfather',
              color: '#b90d0d',
              ownerEmail: user1.email,
            },
            {
              name: 'Dark',
              color: '#ffd500',
              ownerEmail: user1.email,
            },
          ],
        },
      },
    },
  })
  await Promise.all(
    getFlashcards({
      folderId: folder.id,
      ownerEmail: user1.email,
      tagNames,
    }).map((flashcard) => {
      return db.flashcard.create({ data: flashcard })
    })
  )
}

seed()

function getFlashcards({
  folderId,
  ownerEmail,
  tagNames,
}: {
  folderId: string
  ownerEmail: string
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
      owner: {
        connect: {
          email: ownerEmail,
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
