import { mapFlashcard } from '~/utils.server'
import { requireUserEmail } from '~/server/session.server'
import { useLocation, cache, createAsync, useParams } from '@solidjs/router'
import { db } from '~/db/db.server'
import { TurnableFlashcard } from '~/components/TurnableFlashcard/TurnableFlashcard'

const routeData = cache(async (tagId: string) => {
  'use server'

  const email = await requireUserEmail()

  const tag = await db.tag.findFirst({
    where: {
      id: tagId,
      owner: { email },
    },
    include: {
      flashcards: {
        include: {
          folder: true,
          tags: true,
        },
      },
    },
  })
  const folders = await db.folder.findMany({ where: { owner: { email } } })
  if (!tag) {
    throw new Error('Not found')
  }

  return {
    flashcards: tag.flashcards.map((tag) => mapFlashcard(tag, folders)),
    tagName: tag.name,
  }
}, 'tag-tagId')

export default function Tag() {
  const params = useParams()
  const data = createAsync(() => routeData(params.tagId))
  const location = useLocation()
  const upUrl = location.pathname.split('/').slice(0, -1).join('/')
  return (
    <div class="p-8">
      <h1>Tag {data()?.tagName}</h1>
      <a href={upUrl}>Up</a>
      <div
        class="grid gap-4"
        style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))"
      >
        {data()?.flashcards.map((flashcard) => {
          return <TurnableFlashcard flashcard={flashcard} />
        })}
      </div>
    </div>
  )
}
