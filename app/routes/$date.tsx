import { useParams } from 'react-router'
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  useLoaderData,
} from 'remix'
import repeatFlashcardsStyles from '~/styles/repeat-flashcards.css'
import { actionSuccess, Flashcard, indexLoader } from '~/utils.server'
import { useMemo, useRef, useState } from 'react'
import { shuffle } from 'lodash'

export const loader: LoaderFunction = async () => {
  return indexLoader()
}

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData()
  const flashcardIndex = body.get('flashcardIndex')

  if (flashcardIndex) {
    actionSuccess(Number(flashcardIndex) + 1)
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
      ),
    []
  )

  const input = useRef<HTMLInputElement>(null)
  const [isFront, setIsFront] = useState(true)
  const [wasTurned, setWasTurned] = useState(false)
  const [typedCorrectly, setTypedCorrectly] = useState<boolean | undefined>()
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(0)

  const currentFlashcard = selectedFlashcards[currentFlashcardIndex]
  const flashcardIndex =
    initialFlashcards.current.findIndex(
      (flashcard) => flashcard === currentFlashcard
    ) + 1
  const nextFlashcard = () => {
    setIsFront(true)
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

  const handleCorrect = () => {
    nextFlashcard()
  }
  const handleWrong = () => {
    nextFlashcard()
  }
  if (currentFlashcard === undefined) {
    return (
      <div>
        <Link to="/">
          <h1>Fiszki</h1>
        </Link>
        Brak fiszek na ten dzień
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/">
          <h1>Fiszki</h1>
        </Link>
        <div className="folder-list">
          {currentFlashcard.folder
            .split('/')
            .slice(1)
            .map((folder) => {
              return <div className="folder">{folder}</div>
            })}
        </div>
      </div>

      <div className="flashcard">
        {isFront ? (
          <div>
            {currentFlashcard.front}
            {currentFlashcard.frontExample && (
              <>
                <hr />
                {currentFlashcard.frontExample}
              </>
            )}
          </div>
        ) : (
          <div>
            {currentFlashcard.back}
            {currentFlashcard.backExample && (
              <>
                <hr />
                {currentFlashcard.backExample}
              </>
            )}
          </div>
        )}
      </div>
      <div>
        <button
          className="turn-button"
          onClick={() => {
            setIsFront((prevState) => !prevState)
            setWasTurned(true)
          }}
        >
          odwróć
        </button>
        {(wasTurned || typedCorrectly === false) && typedCorrectly !== true && (
          <>
            <Form method="post" onSubmit={handleCorrect}>
              <input
                type="hidden"
                name="flashcardIndex"
                value={flashcardIndex}
              />
              <button className="good-button">dobrze</button>
            </Form>
            <button onClick={handleWrong} className="bad-button">
              źle
            </button>
          </>
        )}
        {(!wasTurned || typedCorrectly !== undefined) && (
          <>
            <div className=''>
              <input ref={input} type="text" />
              {typedCorrectly === true && (
                <div>
                  <Form method="post" onSubmit={handleCorrect}>
                    <input
                      type="hidden"
                      name="flashcardIndex"
                      value={flashcardIndex}
                    />
                    <button className="good-button">Świetnie, idź dalej</button>
                  </Form>
                </div>
              )}
            </div>
            {typedCorrectly === false && 'źle'}
            {typedCorrectly === undefined && (
              <button
                onClick={() => {
                  if (
                    input.current?.value.toLowerCase().trim() ===
                    currentFlashcard.back.toLowerCase().trim()
                  ) {
                    setTypedCorrectly(true)
                  } else {
                    setTypedCorrectly(false)
                    setIsFront(false)
                  }
                }}
              >
                sprawdź
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
