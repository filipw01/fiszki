import React from 'react'
import { MetaFunction } from '@remix-run/server-runtime'
import { Flashcard, Tag } from '~/utils.server'
import { Link, useMatches } from '@remix-run/react'

export const meta: MetaFunction = () => {
  return { title: `Fiszki - tagi` }
}

export default function Tag() {
  const [, { data }] = useMatches()
  const { tags, flashcards } = data as { tags: Tag[]; flashcards: Flashcard[] }
  const folders = new Set(flashcards.map((flashcard) => flashcard.folder))
  const usedTags = tags.filter(
    (tag) => folders.has(tag.name) && !tag.name.includes('/')
  )
  return (
    <div>
      <Link to="/study">Kalendarz</Link>
      <h1>Tagi</h1>
      <ul>
        {usedTags.map((tag) => {
          const deepFlashcardsFromTag = flashcards.filter((flashcard) =>
            flashcard.folder.startsWith(tag.name)
          )
          return (
            <li key={tag.name}>
              <Link to={`/study/tag/${tag.name}`}>
                {tag.name} ({deepFlashcardsFromTag.length})
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
