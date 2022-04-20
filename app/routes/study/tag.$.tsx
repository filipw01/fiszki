import React from 'react'
import { MetaFunction } from '@remix-run/server-runtime'
import { Link, useLocation, useMatches } from '@remix-run/react'
import { useParams } from 'react-router'
import { Flashcard, Tag } from '~/utils.server'

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - tag ${params.tagName}` }
}

export default function Tag() {
  const params = useParams()
  const location = useLocation()
  const [, { data }] = useMatches()
  const { flashcards, tags } = data as { flashcards: Flashcard[]; tags: Tag[] }
  const path = params['*'] as string
  const regex = new RegExp(`^${path}/(?!.*/.*)`)
  const subfolders = tags.filter((tag) => regex.test(tag.name))
  const flashcardsInFolder = flashcards.filter(
    (flashcard) => flashcard.folder == path
  )
  const upUrl = location.pathname.split('/').slice(0, -1).join('/')
  return (
    <div>
      <h1>Tag</h1>
      <Link to={upUrl}>Up</Link>
      <div style={{ margin: '10px 0' }}>
        {subfolders.map(({ name }) => {
          const deepFlashcardsFromSubfolder = flashcards.filter((flashcard) =>
            flashcard.folder.startsWith(name)
          )
          return (
            <div key={name}>
              <Link to={name}>
                {name} ({deepFlashcardsFromSubfolder.length})
              </Link>
            </div>
          )
        })}
      </div>
      {flashcardsInFolder.map((flashcard) => {
        return <div key={flashcard.id}>{flashcard.front}</div>
      })}
    </div>
  )
}
