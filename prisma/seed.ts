import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'

const db = new PrismaClient()

async function seed() {
  const user = await register({
    email: 'test@test.com',
    password: 'test',
  })
  const tagIds = (
    await Promise.all(
      Array(10)
        .fill(undefined)
        .map(() => {
          return db.tag.create({
            data: {
              name: faker.random.word(),
              color: faker.color.rgb({ prefix: '#' }),
              owner: { connect: { email: user.email } },
            },
          })
        })
    )
  ).map((tag) => tag.id)

  await db.folder.create({
    data: {
      name: faker.random.word(),
      color: faker.color.rgb({ prefix: '#' }),
      ownerEmail: user.email,
      folders: {
        createMany: {
          data: [
            {
              name: faker.random.word(),
              color: faker.color.rgb({ prefix: '#' }),
              ownerEmail: user.email,
            },
            {
              name: faker.random.word(),
              color: faker.color.rgb({ prefix: '#' }),
              ownerEmail: user.email,
            },
            {
              name: faker.random.word(),
              color: faker.color.rgb({ prefix: '#' }),
              ownerEmail: user.email,
            },
          ],
        },
      },
    },
  })
  const folders = await db.folder.findMany()
  await Promise.all(
    Array(1000)
      .fill(undefined)
      .map(() => {
        const randomFolder = faker.datatype.number({ max: folders.length - 1 })
        const folder = folders[randomFolder]
        const randomTagIds = [
          ...new Set(
            Array(faker.datatype.number({ min: 0, max: 4 }))
              .fill(undefined)
              .map(() => {
                return tagIds[faker.datatype.number({ max: tagIds.length - 1 })]
              })
          ),
        ]

        return db.flashcard.create({
          data: getRandomFlashcard({
            folderId: folder.id,
            ownerEmail: user.email,
            tagIds: randomTagIds,
          }),
        })
      })
  )
}

const getRandomFlashcard = ({
  folderId,
  ownerEmail,
  tagIds,
}: {
  folderId: string
  ownerEmail: string
  tagIds: string[]
}) => {
  return {
    front: faker.word.words(faker.number.int({ min: 1, max: 7 })),
    frontLanguage: 'en-US',
    backLanguage: 'en-US',
    frontImage: faker.datatype.boolean()
      ? 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fmiro.medium.com%2Fmax%2F3840%2F1*xMuIOwjliGUPjkzukeWKfw.jpeg&f=1&nofb=1&ipt=022a3ab5d6d53abd2540496747958c2c664ad89843635a281e3542b6984a789f&ipo=images'
      : null,
    back: faker.word.words(faker.number.int(7)),
    frontDescription: faker.datatype.boolean()
      ? faker.lorem.sentence({ min: 5, max: 60 })
      : null,
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
    streak: faker.number.int({ max: 3 }),
    nextStudy: faker.date.soon(30),
    lastSeen: faker.date.recent(30),
    randomSideAllowed: false,
    tags: {
      connect: tagIds.map((id) => ({ id })),
    },
  }
}

const register = async ({
  password,
  email,
}: {
  password: string
  email: string
}) => {
  const passwordHash = await bcrypt.hash(password, 10)
  return await db.user.create({
    data: { email, password: passwordHash },
  })
}

seed()
