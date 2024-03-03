import { mapTag } from '~/utils.server'
import { requireUserEmail } from '~/server/session.server'
import { db } from '~/db/db.server'
import { For } from 'solid-js'
import { Tag } from '~/components/Tag'
import { HeadingWithCreate } from '~/components/HeadingWithCreate'
import { cache, createAsync } from '@solidjs/router'

const routeData = cache(async () => {
  'use server'

  const email = await requireUserEmail()
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
}, 'tags-index')

export default function Index() {
  const data = createAsync(() => routeData())
  return (
    <div class="p-8">
      <HeadingWithCreate url="/tags/create">Tags</HeadingWithCreate>

      <div class="flex flex-wrap gap-x-2 gap-y-2 lg:gap-x-4 lg:gap-y-4 mt-4">
        <For each={data()?.tags}>
          {(tag) => (
            <div class="flex items-center gap-2">
              <a href={`/tags/${tag.id}`}>
                <Tag color={tag.color}>
                  {`${tag.name} (${tag.flashcardsCount})`}
                </Tag>
              </a>
              <a href={`/tags/edit/${tag.id}`}>Edit</a>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
