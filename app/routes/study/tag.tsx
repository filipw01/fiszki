import React from 'react'
import { json, LoaderFunction, MetaFunction } from '@remix-run/server-runtime'
import { mapTag } from '~/utils.server'
import { Link, useLoaderData } from '@remix-run/react'
import { Folder } from '~/components/Folder'
import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'
import { Prisma } from '@prisma/client'
import { styled } from '~/styles/stitches.config'

export const meta: MetaFunction = () => {
  return { title: `Fiszki - tagi` }
}

type LoaderData = {
  topLevelFolders: (Prisma.FolderGetPayload<{}> & {
    _count: {
      flashcards: number
      folders: number
    }
  })[]
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

export const loader: LoaderFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  const [topLevelFolders, tags] = await Promise.all([
    db.folder.findMany({
      where: {
        parentFolderId: null,
        owner: { email },
      },
      include: {
        _count: {
          select: {
            folders: true,
            flashcards: true,
          },
        },
      },
    }),
    db.tag.findMany({
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
    }),
  ])

  const mappedTags = tags.map((tag) => ({
    ...mapTag(tag),
    flashcardsCount: tag._count.flashcards,
    id: tag.id,
  }))

  return json<LoaderData>({ topLevelFolders, tags: mappedTags })
}

export default function Tag() {
  const { topLevelFolders, tags } = useLoaderData<LoaderData>()
  return (
    <div>
      <h1>Tags</h1>
      <FoldersContainer>
        {topLevelFolders.map(({ name, _count, color }) => {
          return (
            <Folder
              key={name}
              nameLink={`/study/tag/${name}`}
              studyLink={`/study/study-tag/${name}`}
              name={name}
              count={_count.folders + _count.flashcards}
              color={color}
            />
          )
        })}
        {tags.map(({ color: { r, g, b }, name, flashcardsCount, id }) => {
          return (
            <Folder
              key={id}
              nameLink={`/study/tag/${id}`}
              studyLink={`/study/study-tag/${id}`}
              name={`Tag: ${name}`}
              count={flashcardsCount}
              color={`rgb(${r},${g},${b})`}
            />
          )
        })}
      </FoldersContainer>
    </div>
  )
}

export const FoldersContainer = styled('div', {
  display: 'grid',
  gap: '1rem',
  margin: '1rem 0',
  gridTemplateColumns: 'repeat(auto-fill, minmax(122px, 1fr))',
})
