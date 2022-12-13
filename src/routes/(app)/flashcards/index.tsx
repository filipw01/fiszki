import { requireUserEmail } from '~/session.server'
import { db } from '~/db/db.server'
import { createServerData$, redirect } from 'solid-start/server'
import { useRouteData } from 'solid-start'

export const routeData = () =>
  createServerData$(async (_, { request }) => {
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
      return redirect('/flashcards/folder/create')
    }
    return redirect(`/flashcards/folder/${folder.id}`)
  })

export default function Index() {
  const data = useRouteData<typeof routeData>()
  data() // trigger routeData
  return null
}
