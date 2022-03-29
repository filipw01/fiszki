import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { ActionFunction, LoaderFunction } from '@remix-run/server-runtime'
import { Form, useLoaderData } from '@remix-run/react'
import { styled } from '@stitches/react'
import { shuffle } from 'lodash'
import {
  actionFailure,
  actionSuccess,
  Flashcard as FlashcardType,
  indexLoader,
} from '~/utils.server'
import { TagList } from '~/components/TagList'
import { Flashcard } from '~/components/Flashcard'
import { Button } from '~/components/Button'

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

      <AnswerHolder>
        <AnswerField
          correct={typedCorrectly}
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
          <Button
            type="button"
            color="check"
            position="standalone"
            onClick={handleCheck}
          >
            sprawdź
          </Button>
        ) : (
          <ResultButtons>
            {!typedCorrectly && (
              <ResultForm method="post" onSubmit={nextFlashcard}>
                <input
                  type="hidden"
                  name="flashcardIndex"
                  value={flashcardIndex}
                />
                <input type="hidden" name="action" value="failure" />
                <Button color="bad" position="left">
                  źle
                </Button>
              </ResultForm>
            )}
            <ResultForm method="post" onSubmit={nextFlashcard}>
              <input
                type="hidden"
                name="flashcardIndex"
                value={flashcardIndex}
              />
              <input type="hidden" name="action" value="success" />
              {typedCorrectly ? (
                <Button
                  color="good"
                  position="standalone"
                  ref={goodButtonTypedCorrectly}
                >
                  Dobrze, świetna robota 🤩
                </Button>
              ) : (
                <Button color="good" position="right">
                  dobrze
                </Button>
              )}
            </ResultForm>
          </ResultButtons>
        )}
      </AnswerHolder>
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

const ResultButtons = styled('div', {
  display: 'flex',
})

const ResultForm = styled(Form, {
  flex: '0px 1 1',
})

const AnswerHolder = styled('div', {
  background: '#fff',
  marginTop: 28,
  borderRadius: 20,
  overflow: 'hidden',
  boxShadow: '0 4px 4px 0 rgba(183, 183, 183, 0.25)',
})

const AnswerField = styled('textarea', {
  display: 'block',
  fontSize: 20,
  padding: '24px 28px',
  marginRight: -8,
  border: 'none',
  width: '100%',
  height: 180,
  resize: 'none',
  borderRadius: '20px 20px 0 0',
  background: '#fff',
  '&::placeholder': {
    color: 'rgb(172, 172, 172)',
  },

  variants: {
    correct: {
      true: {
        color: 'rgb(138, 201, 38)',
      },
      false: {
        color: 'rgb(218, 80, 5)',
      },
    },
  },
})
