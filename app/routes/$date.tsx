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
import { useMemo, useRef, useState } from 'react'
import { shuffle } from 'lodash'

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

  const input = useRef<HTMLTextAreaElement>(null)
  const [wasTurned, setWasTurned] = useState(false)
  const [typedCorrectly, setTypedCorrectly] = useState<boolean | undefined>()
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(0)

  const currentFlashcard = selectedFlashcards[currentFlashcardIndex]
  const flashcardIndex =
    initialFlashcards.current.findIndex(
      (flashcard) => flashcard === currentFlashcard
    ) + 1
  const nextFlashcard = () => {
    setWasTurned(false)
    setTypedCorrectly(undefined)
    if (input.current) {
      input.current.value = ''
    }
    setCurrentFlashcardIndex((prevIndex) => {
      if (prevIndex >= selectedFlashcards.length - 1) {
        window.location.reload()
      }
      return prevIndex + 1
    })
  }

  if (currentFlashcard === undefined) {
    return <div>Brak fiszek na ten dzień</div>
  }

  return (
    <div>
      <div className="tag-list">
        <div className="folder">
          <FolderIcon />
          <span className="folder__text">{currentFlashcard.folder}</span>
        </div>
      </div>
      <div className="flashcards-holder">
        <div className="flashcard">
          <div>
            {currentFlashcard.front}
            {currentFlashcard.frontExample && (
              <>
                <hr />
                {currentFlashcard.frontExample}
              </>
            )}
          </div>
        </div>
        <div className="flashcard">
          {wasTurned ? (
            <div>
              {currentFlashcard.back}
              {currentFlashcard.backExample && (
                <>
                  <hr />
                  {currentFlashcard.backExample}
                </>
              )}
            </div>
          ) : (
            <div>?</div>
          )}
        </div>
      </div>

      <div>
        {(wasTurned || typedCorrectly === false) && typedCorrectly !== true && (
          <>
            <Form method="post" onSubmit={nextFlashcard}>
              <input
                type="hidden"
                name="flashcardIndex"
                value={flashcardIndex}
              />
              <input type="hidden" name="action" value="success" />
              <button className="good-button">dobrze</button>
            </Form>
            <Form method="post" onSubmit={nextFlashcard}>
              <input
                type="hidden"
                name="flashcardIndex"
                value={flashcardIndex}
              />
              <input type="hidden" name="action" value="failure" />
              <button className="bad-button">źle</button>
            </Form>
          </>
        )}
        {(!wasTurned || typedCorrectly !== undefined) && (
          <>
            <div className="answer-holder">
              <textarea
                ref={input}
                disabled={typedCorrectly !== undefined}
                spellCheck={false}
              />
              {typedCorrectly !== true ? (
                <button
                  className="check-button"
                  disabled={typedCorrectly === false}
                  onClick={() => {
                    if (
                      input.current?.value.toLowerCase().trim() ===
                      currentFlashcard.back.toLowerCase().trim()
                    ) {
                      setTypedCorrectly(true)
                    } else {
                      setTypedCorrectly(false)
                    }
                    setWasTurned(true)
                  }}
                >
                  {typedCorrectly === false ? 'źle' : 'sprawdź'}
                </button>
              ) : (
                <Form
                  method="post"
                  onSubmit={nextFlashcard}
                  style={{ width: '100%' }}
                >
                  <input
                    type="hidden"
                    name="flashcardIndex"
                    value={flashcardIndex}
                  />
                  <input type="hidden" name="action" value="success" />
                  <button className="good-button">Świetnie, idź dalej</button>
                </Form>
              )}
            </div>
          </>
        )}
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
