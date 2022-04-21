import React, { useState } from 'react'
import { MetaFunction } from '@remix-run/server-runtime'
import { styled } from '~/styles/stitches.config'
import { Link, useLocation, useMatches } from '@remix-run/react'
import { useParams } from 'react-router'
import { Flashcard as FlashcardType, Tag } from '~/utils.server'
import { Flashcard } from '~/components/Flashcard'
import { Folder } from '~/components/Folder'

export const meta: MetaFunction = ({ params }) => {
  return { title: `Fiszki - tag ${params['*']}` }
}

export default function Tag() {
  const params = useParams()
  const location = useLocation()
  const [, { data }] = useMatches()
  const { flashcards, tags } = data as {
    flashcards: FlashcardType[]
    tags: Tag[]
  }
  const path = params['*'] as string
  const depth = (path.match(/\//g)?.length ?? 0) + 1
  const folders = Array.from(
    new Set(
      flashcards
        .filter((flashcard) => flashcard.folder.startsWith(`${path}/`))
        .map((flashcard) =>
          flashcard.folder
            .split('/')
            .slice(depth, depth + 1)
            .join('/')
        )
    )
  )
  const subfolders: Tag[] = folders.map((folder) => ({
    name: folder,
    color: tags.find((tag) => tag.name === folder)?.color ?? {
      r: 128,
      g: 128,
      b: 128,
    },
  }))
  const flashcardsInFolder = flashcards.filter(
    (flashcard) => flashcard.folder == path || flashcard.tags.includes(path)
  )
  const upUrl = location.pathname.split('/').slice(0, -1).join('/')
  return (
    <div>
      <h1>Tag {path}</h1>
      <Link to={upUrl}>Up</Link>
      <FoldersContainer>
        {subfolders.map(({ name, color: { r, g, b } }) => {
          const deepFlashcardsFromSubfolder = flashcards.filter((flashcard) =>
            flashcard.folder.startsWith(`${path}/${name}`)
          )
          return (
            <div key={name}>
              <Link to={`${path}/${name}`}>
                <Folder
                  name={name}
                  count={deepFlashcardsFromSubfolder.length}
                  color={`rgb(${r},${g},${b})`}
                />
              </Link>
            </div>
          )
        })}
      </FoldersContainer>
      <FlashcardsContainer>
        {flashcardsInFolder.map((flashcard) => {
          return <TurnableFlashcard key={flashcard.id} flashcard={flashcard} />
        })}
      </FlashcardsContainer>
    </div>
  )
}

const TurnableFlashcard = ({ flashcard }: { flashcard: FlashcardType }) => {
  const [isFront, setIsFront] = useState(true)
  const turn = () => setIsFront((prev) => !prev)
  return isFront ? (
    <Flashcard
      onClick={turn}
      text={flashcard.front}
      example={flashcard.frontExample}
      image={flashcard.frontImage}
    />
  ) : (
    <Flashcard
      onClick={turn}
      text={flashcard.back}
      image={flashcard.backImage}
      example={flashcard.backExample}
    />
  )
}

export const FoldersContainer = styled('div', {
  display: 'grid',
  gap: '1rem',
  margin: '1rem 0',
  gridTemplateColumns: 'repeat(auto-fill, minmax(122px, 1fr))',
})

const FlashcardsContainer = styled('div', {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
})
