import { Flashcard as FlashcardType, mapFlashcard } from '~/utils.server'
import { Flashcard } from '~/components/Flashcard'
import { requireUserEmail } from '~/session.server'
import { createServerData$ } from 'solid-start/server'
import { RouteDataArgs, useRouteData, useLocation, A } from 'solid-start'
import { db } from '~/db/db.server'
import { createSignal } from 'solid-js'

export const routeData = ({ params }: RouteDataArgs) =>
  createServerData$(
    async ([, tagId], { request }) => {
      const email = await requireUserEmail(request)

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
    },
    { key: () => ['tag', params.tagId] }
  )

export default function Tag() {
  const data = useRouteData<typeof routeData>()
  const location = useLocation()
  const upUrl = location.pathname.split('/').slice(0, -1).join('/')
  return (
    <div class="p-8">
      <h1>Tag {data()?.tagName}</h1>
      <A href={upUrl}>Up</A>
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

const TurnableFlashcard = (props: { flashcard: FlashcardType }) => {
  const [isFront, setIsFront] = createSignal(true)
  const turn = () => setIsFront((prev) => !prev)
  return isFront() ? (
    <Flashcard
      onClick={turn}
      text={props.flashcard.front}
      example={props.flashcard.frontDescription}
      image={props.flashcard.frontImage}
      tags={props.flashcard.tags}
      id={props.flashcard.id}
    />
  ) : (
    <Flashcard
      id={props.flashcard.id}
      onClick={turn}
      text={props.flashcard.back}
      image={props.flashcard.backImage}
      example={props.flashcard.backDescription}
      tags={props.flashcard.tags}
    />
  )
}
