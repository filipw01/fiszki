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
  const usedTags: Tag[] = topLevelFolders.map((folder) => ({
    name: folder,
    color: tags.find((tag) => tag.name === folder)?.color ?? {
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
        {usedTags.map(({ color: { r, g, b }, name }) => {
          const deepFlashcardsFromTag = flashcards.filter((flashcard) =>
            flashcard.folder.startsWith(name)
          )
          return (
            <Link key={name} to={`/study/tag/${name}`}>
              <Folder
                name={name}
                count={deepFlashcardsFromTag.length}
                color={`rgb(${r},${g},${b})`}
              />
            </Link>
          )
        })}
      </FoldersContainer>
    </div>
  )
}
