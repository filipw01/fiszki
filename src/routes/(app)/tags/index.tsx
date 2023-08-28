import { mapTag } from '~/utils.server'
import { requireUserEmail } from '~/session.server'
import { createServerData$ } from 'solid-start/server'
import { db } from '~/db/db.server'
import { A, useRouteData } from 'solid-start'
import { For } from 'solid-js'
import { Tag } from '~/components/Tag'
import { HeadingWithCreate } from '~/components/HeadingWithCreate'

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
      <HeadingWithCreate url="/tags/create">Tags</HeadingWithCreate>

      <div class="flex flex-wrap gap-x-2 gap-y-2 lg:gap-x-4 lg:gap-y-4 mt-4">
        <For each={data()?.tags}>
          {(tag) => (
            <div class="flex items-center gap-2">
              <A href={`/tags/${tag.id}`}>
                <Tag color={tag.color}>
                  {`${tag.name} (${tag.flashcardsCount})`}
                </Tag>
              </A>
              <A href={`/tags/edit/${tag.id}`}>Edit</A>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
