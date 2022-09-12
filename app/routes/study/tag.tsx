import React from 'react'
import { MetaFunction } from '@remix-run/server-runtime'
import { Flashcard, Tag } from '~/utils.server'
import { Link, useMatches } from '@remix-run/react'
import { FoldersContainer } from '~/routes/study/tag.$'
import { Folder } from '~/components/Folder'

export const meta: MetaFunction = () => {
  return { title: `Fiszki - tagi` }
}

export default function Tag() {
  const [, { data }] = useMatches()
  const { tags, flashcards } = data as { tags: Tag[]; flashcards: Flashcard[] }
  const topLevelFolders = Array.from(
    new Set(flashcards.map((flashcard) => flashcard.folder.split('/')[0]))
  )
  const usedFolders: Tag[] = topLevelFolders.map((folder) => ({
    name: folder,
    color: tags.find((tag) => tag.name === folder)?.color ?? {
      r: 128,
      g: 128,
      b: 128,
    },
  }))
  const usedTags: Tag[] = Array.from(
    new Set(flashcards.flatMap((flashcard) => flashcard.tags))
  ).map((tag) => ({
    name: tag,
    color: tags.find((tagData) => tagData.name === tag)?.color ?? {
      r: 128,
      g: 128,
      b: 128,
    },
  }))
  return (
    <div>
      <Link to="/study">Kalendarz</Link>
      <h1>Tagi</h1>
      <FoldersContainer>
        {usedFolders.map(({ color: { r, g, b }, name }) => {
          const deepFlashcardsFromTag = flashcards.filter((flashcard) =>
            flashcard.folder.startsWith(name)
          )
          return (
            <Folder
              key={name}
              nameLink={`/study/tag/${name}`}
              studyLink={`/study/study-tag/${name}`}
              name={name}
              count={deepFlashcardsFromTag.length}
              color={`rgb(${r},${g},${b})`}
            />
          )
        })}
        {usedTags.map(({ color: { r, g, b }, name }) => {
          const flashcardsInTag = flashcards.filter((flashcard) =>
            flashcard.tags.includes(name)
          )
          return (
            <Folder
              key={name}
              nameLink={`/study/tag/${name}`}
              studyLink={`/study/study-tag/${name}`}
              name={`Tag: ${name}`}
              count={flashcardsInTag.length}
              color={`rgb(${r},${g},${b})`}
            />
          )
        })}
      </FoldersContainer>
    </div>
  )
}
