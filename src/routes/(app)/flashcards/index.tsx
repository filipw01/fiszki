import { requireUserEmail } from '~/server/session.server'
import { db } from '~/db/db.server'
import { cache, createAsync, redirect } from '@solidjs/router'

const routeData = cache(async () => {
  'use server'

  const email = await requireUserEmail()
  const folder = await db.folder.findFirst({
    where: {
      owner: {
        email,
      },
      parentFolderId: null,
    },
  })
  if (!folder) {
    throw redirect('/flashcards/folder/create')
  }
  throw redirect(`/flashcards/folder/${folder.id}`)
}, 'flashcards-index')

export default function Index() {
  const data = createAsync(() => routeData())
  data() // trigger routeData
  return null
}
