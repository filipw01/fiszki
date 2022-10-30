import React from 'react'
import { json, MetaFunction } from '@remix-run/server-runtime'
import { mapTag } from '~/utils.server'
import { useLoaderData } from '@remix-run/react'
import { Folder } from '~/components/Folder'
import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'
import { LoaderArgs } from '@remix-run/node'

export const meta: MetaFunction = () => {
  return { title: `Fiszki - tagi` }
}

type LoaderData = {
  tags: {
    flashcardsCount: number
    name: string
    id: string
    color: {
      r: number
      g: number
      b: number
    }
  }[]
}

export const loader = async ({ request }: LoaderArgs) => {
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

  return json<LoaderData>({ tags: mappedTags })
}

export default function Tag() {
  const { tags } = useLoaderData<typeof loader>()
  return (
    <div>
      <h2>Tags</h2>

      <FoldersContainer>
        {tags.map(({ color: { r, g, b }, name, flashcardsCount, id }) => {
          return (
            <Folder
              key={id}
              nameLink={`/study/tag/${id}`}
              studyLink={`/study/study-tag/${id}`}
              name={name}
              count={flashcardsCount}
              color={`rgb(${r},${g},${b})`}
            />
          )
        })}
      </FoldersContainer>
    </div>
  )
}

export const FoldersContainer = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <div
      className="grid gap-4 my-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(122px, 1fr))' }}
    >
      {children}
    </div>
  )
}
