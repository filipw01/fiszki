import { mapTag } from '~/utils.server'
import { Folder } from '~/components/Folder'
import { requireUserEmail } from '~/session.server'
import { createServerData$ } from 'solid-start/server'
import { db } from '~/db/db.server'
import { A, useRouteData } from 'solid-start'
import { JSX } from 'solid-js'

export const routeData = () =>
  createServerData$(async (_, { request }) => {
    const email = await requireUserEmail(request)
    const tags = await db.tag.findMany({
      where: {
        owner: { email },
      },
      include: {
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    })

    const mappedTags = tags.map((tag) => ({
      ...mapTag(tag),
      flashcardsCount: tag._count.flashcards,
      id: tag.id,
    }))

    return { tags: mappedTags }
  })

export default function Index() {
  const data = useRouteData<typeof routeData>()
  return (
    <div class="p-8">
      <h2>Tags</h2>

      <A href="/tags/create">Create new tag</A>
      <FoldersContainer>
        {data()?.tags.map(
          ({ color: { r, g, b }, name, flashcardsCount, id }) => {
            return (
              <div>
                <Folder
                  nameLink={`/study/tag/${id}`}
                  studyLink={`/study/study-tag/${name}`}
                  name={name}
                  count={flashcardsCount}
                  color={`rgb(${r},${g},${b})`}
                />
                <A href={`/tags/edit/${id}`}>Edit</A>
              </div>
            )
          }
        )}
      </FoldersContainer>
    </div>
  )
}

export const FoldersContainer = (props: { children: JSX.Element }) => {
  return (
    <div
      class="grid gap-4 my-4"
      style="grid-template-columns: repeat(auto-fill, minmax(122px, 1fr))"
    >
      {props.children}
    </div>
  )
}
