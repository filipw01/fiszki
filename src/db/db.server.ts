import { Prisma, PrismaClient } from '@prisma/client'

export const db = import.meta.env.SSR
  ? new PrismaClient()
  : ({} as PrismaClient<
      Prisma.PrismaClientOptions,
      never,
      Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
    >) // TODO: why is this included in client bundle without the ternary?
