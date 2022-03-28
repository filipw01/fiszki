import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { ActionFunction, LoaderFunction } from '@remix-run/server-runtime'
import { Form, useLoaderData } from '@remix-run/react'
import { styled } from '@stitches/react'
import { shuffle } from 'lodash'
import repeatFlashcardsStyles from '~/styles/repeat-flashcards.css'
import {
  actionFailure,
  actionSuccess,
  Flashcard as FlashcardType,
  indexLoader,
} from '~/utils.server'
import { TagList } from '~/components/TagList'
import { Flashcard } from '~/components/Flashcard'

export const loader: LoaderFunction = async () => {
  return indexLoader()
}

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData()
  const flashcardIndex = body.get('flashcardIndex')
  const action = body.get('action')

  if (flashcardIndex) {
    if (action === 'success') {
      actionSuccess(Number(flashcardIndex) + 1)
    }
    if (action === 'failure') {
      actionFailure(Number(flashcardIndex) + 1)
    }
  }
  return null
}

export const links = () => {
  return [{ rel: 'stylesheet', href: repeatFlashcardsStyles }]
}

export default function RepeatFlashcards() {
  const { date } = useParams()
  const flashCards = useLoaderData<FlashcardType[]>()
  const initialFlashcards = useRef(flashCards)
  const selectedFlashcards = useMemo(
    () =>
      shuffle(
        initialFlashcards.current.filter(
          (flashcard) => flashcard.nextStudy === date
        )
      ).sort(
        (flashcardA, flashcardB) => flashcardA.lastSeen - flashcardB.lastSeen
      ),
    []
  )

  const goodButtonTypedCorrectly = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const [typedCorrectly, setTypedCorrectly] = useState<boolean | undefined>()
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(0)
  useEffect(() => {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') {
        goodButtonTypedCorrectly.current?.click()
      }
    })
  }, [])

  const currentFlashcard = selectedFlashcards[currentFlashcardIndex]
  const flashcardIndex =
    initialFlashcards.current.findIndex(
      (flashcard) => flashcard === currentFlashcard
    ) + 1
  const nextFlashcard = () => {
    setTypedCorrectly(undefined)
    if (input.current) {
      setTimeout(() => {
        input.current?.focus()
      })
      input.current.value = ''
    }
    setCurrentFlashcardIndex((prevIndex) => {
      if (prevIndex >= selectedFlashcards.length - 1) {
        window.location.reload()
      }
      return prevIndex + 1
    })
  }

  const handleCheck = () => {
    if (
      input.current?.value.toLowerCase().trim() ===
      currentFlashcard.back.toLowerCase().trim()
    ) {
      setTypedCorrectly(true)
    } else {
      setTypedCorrectly(false)
    }
  }

  if (currentFlashcard === undefined) {
    return <div>Brak fiszek na ten dzień</div>
  }

  return (
    <div>
      <TagList tags={currentFlashcard.tags} folder={currentFlashcard.folder} />
      <FlashcardsHolder>
        <Flashcard
          text={currentFlashcard.front}
          example={currentFlashcard.frontExample}
        />
        <Flashcard
          text={currentFlashcard.back}
          example={currentFlashcard.backExample}
          hidden={typedCorrectly === undefined}
          correct={typedCorrectly}
        />
      </FlashcardsHolder>

      <div className="answer-holder">
        <textarea
          placeholder="Hm.."
          ref={input}
          autoFocus
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              handleCheck()
              e.stopPropagation()
            }
          }}
          disabled={typedCorrectly !== undefined}
          spellCheck={false}
        />
        {typedCorrectly === undefined ? (
          <button type="button" className="check-button" onClick={handleCheck}>
            sprawdź
          </button>
        ) : (
          <div className="results-buttons">
            {!typedCorrectly && (
              <Form
                method="post"
                onSubmit={nextFlashcard}
                className="result-form"
              >
                <input
                  type="hidden"
                  name="flashcardIndex"
                  value={flashcardIndex}
                />
                <input type="hidden" name="action" value="failure" />
                <button className="bad-button">źle</button>
              </Form>
            )}
            <Form
              method="post"
              onSubmit={nextFlashcard}
              className="result-form"
            >
              <input
                type="hidden"
                name="flashcardIndex"
                value={flashcardIndex}
              />
              <input type="hidden" name="action" value="success" />
              {typedCorrectly ? (
                <button
                  className="good-button only-button"
                  ref={goodButtonTypedCorrectly}
                >
                  Dobrze, świetna robota 🤩
                </button>
              ) : (
                <button className="good-button">dobrze</button>
              )}
            </Form>
          </div>
        )}
      </div>
    </div>
  )
}

const FlashcardsHolder = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: 28,
  '@media (max-width: 960px)': {
    display: 'flex',
    gap: 16,
  },
})
