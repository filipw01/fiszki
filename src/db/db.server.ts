import { PrismaClient } from '@prisma/client'

export const db = import.meta.env.SSR
  ? new PrismaClient()
  : ({} as PrismaClient) // TODO: change to server function getter
