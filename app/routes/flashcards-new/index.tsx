import { redirect } from '@remix-run/server-runtime'
import { requireUserEmail } from '~/session.server'
import { LoaderArgs } from '@remix-run/node'
import { db } from '~/utils/db.server'

export const loader = async ({ request }: LoaderArgs) => {
  const email = await requireUserEmail(request)
  const folder = await db.folder.findFirst({
    where: {
      owner: {
        email,
      },
      parentFolderId: null,
    },
  })
  if (!folder) {
    return redirect('/folders/create')
  }
  return redirect(`/flashcards-new/folder/${folder.id}`)
}
