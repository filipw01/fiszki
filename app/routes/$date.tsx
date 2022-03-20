import { useParams } from 'react-router'
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  useLoaderData,
} from 'remix'
import repeatFlashcardsStyles from '~/styles/repeat-flashcards.css'
import {
  actionFailure,
  actionSuccess,
  Flashcard,
  indexLoader,
} from '~/utils.server'
import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from 'lodash'
import catImage from '../assets/cat.png'

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
  const flashCards = useLoaderData<Flashcard[]>()
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
    <div
      className={
        typedCorrectly === true
          ? 'answer--correct'
          : typedCorrectly === false
          ? 'answer--wrong'
          : ''
      }
    >
      <div className="tag-list">
        <div className="folder">
          <FolderIcon />
          <span className="folder__text">{currentFlashcard.folder}</span>
        </div>
        {currentFlashcard.tags.map((tag) => (
          <div key={tag} className="tag">
            <span className="tag__text">{tag}</span>
          </div>
        ))}
      </div>
      <div className="flashcards-holder">
        <div className="flashcard">
          <div>
            <div
              style={{
                fontWeight: getTextLengthBasedFontWeight(
                  currentFlashcard.front
                ),
              }}
            >
              {currentFlashcard.front}
            </div>
            {currentFlashcard.frontExample && (
              <>
                <hr />
                {currentFlashcard.frontExample}
              </>
            )}
          </div>
        </div>
        <div className="flashcard flashcard--back">
          {typedCorrectly !== undefined ? (
            <div>
              <div
                style={{
                  fontWeight: getTextLengthBasedFontWeight(
                    currentFlashcard.back
                  ),
                }}
              >
                {currentFlashcard.back}
              </div>
              {currentFlashcard.backExample && (
                <>
                  <hr />
                  {currentFlashcard.backExample}
                </>
              )}
            </div>
          ) : (
            <div>
              <img src={catImage} alt="" />
            </div>
          )}
        </div>
      </div>

      <div>
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
            <button
              type="button"
              className="check-button"
              onClick={handleCheck}
            >
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
    </div>
  )
}

const FolderIcon = () => (
  <svg
    width="24"
    height="20"
    viewBox="0 0 24 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="folder-icon"
  >
    <path
      d="M9.6 0H2.4C1.08 0 0.012 1.125 0.012 2.5L0 17.5C0 18.875 1.08 20 2.4 20H21.6C22.92 20 24 18.875 24 17.5V5C24 3.625 22.92 2.5 21.6 2.5H12L9.6 0Z"
      fill="currentColor"
    />
  </svg>
)

const getTextLengthBasedFontWeight = (text: string) =>
  text.split(' ').length > 5 ? undefined : 700
