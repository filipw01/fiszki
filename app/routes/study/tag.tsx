import React from 'react'
import { json, MetaFunction } from '@remix-run/server-runtime'
import { mapTag } from '~/utils.server'
import { Link, useLoaderData } from '@remix-run/react'
import { FoldersContainer } from '~/routes/study/tag.$'
import { Folder } from '~/components/Folder'
import { db } from '~/utils/db.server'

export const meta: MetaFunction = () => {
  return { title: `Fiszki - tagi` }
}

export const loader = async () => {
  const [topLevelFolders, tags] = await Promise.all([
    db.folder.findMany({
      where: {
        parentFolderId: null,
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
  }))

  return json({ topLevelFolders, tags: mappedTags })
}

export default function Tag() {
  const { topLevelFolders, tags } = useLoaderData<typeof loader>()
  return (
    <div>
      <Link to="/study">Kalendarz</Link>
      <h1>Tagi</h1>
      <FoldersContainer>
        {topLevelFolders.map(({ name, _count }) => {
          return (
            <Folder
              key={name}
              nameLink={`/study/tag/${name}`}
              studyLink={`/study/study-tag/${name}`}
              name={name}
              count={_count.folders + _count.flashcards}
              color={`rgb(50, 50, 50)`}
            />
          )
        })}
        {tags.map(({ color: { r, g, b }, name, flashcardsCount }) => {
          return (
            <Folder
              key={name}
              nameLink={`/study/tag/${name}`}
              studyLink={`/study/study-tag/${name}`}
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
