import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { ActionFunction } from '@remix-run/server-runtime'
import { Form, useMatches } from '@remix-run/react'
import { styled } from '@stitches/react'
import { shuffle } from 'lodash'
import {
  actionFailure,
  actionSuccess,
  Flashcard as FlashcardType,
  Tag,
} from '~/utils.server'
import { TagList } from '~/components/TagList'
import { Flashcard } from '~/components/Flashcard'
import { Button } from '~/components/Button'
import { LetterButton } from '~/components/LetterButton'

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData()
  const flashcardIndex = body.get('flashcardIndex')
  const action = body.get('action')

  if (flashcardIndex) {
    if (action === 'success') {
      await actionSuccess(Number(flashcardIndex) + 1)
    }
    if (action === 'failure') {
      await actionFailure(Number(flashcardIndex) + 1)
    }
  }
  return null
}

export default function RepeatFlashcards() {
  const { date } = useParams()
  const [, { data }] = useMatches()
  const { flashcards, tags: tagsData } = data as {
    flashcards: FlashcardType[]
    tags: Tag[]
  }
  const initialFlashcards = useRef(flashcards)
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
        return prevIndex
      }
      return prevIndex + 1
    })
  }

  const {
    front,
    back,
    tags,
    folder,
    backExample,
    frontExample,
    hotStreak,
    frontImage,
    backImage,
  } = currentFlashcard

  const handleCheck = () => {
    if (
      input.current?.value.toLowerCase().trim() === back.toLowerCase().trim()
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
      <FlashcardMetadata>
        <TagList tags={tags} folder={folder} tagsData={tagsData} />
        <div>Seria: {hotStreak ? '🔥'.repeat(hotStreak) : '➖'}</div>
      </FlashcardMetadata>
      <FlashcardsHolder>
        <Flashcard text={front} example={frontExample} image={frontImage} />
        <Flashcard
          text={back}
          example={backExample}
          image={backImage}
          hidden={typedCorrectly === undefined}
          correct={typedCorrectly}
        />
      </FlashcardsHolder>

      <AnswerHolder>
        <FlexVCenter>
          <LetterButtonsHolder>
            {['ñ', 'í', 'é', 'á', 'ú', 'ü'].map((letter) => (
              <LetterButton
                key={letter}
                letter={letter}
                onClick={(letter) => {
                  if (input.current) {
                    // insert character at cursor
                    const start = input.current.selectionStart
                    const end = input.current.selectionEnd
                    const value = input.current.value
                    input.current.value =
                      value.substring(0, start) + letter + value.substring(end)
                    input.current.focus()
                    input.current.selectionStart = start + 1
                    input.current.selectionEnd = input.current.selectionStart
                  }
                }}
              />
            ))}
          </LetterButtonsHolder>
          <AnswerField
            correct={typedCorrectly}
            placeholder="Hm.."
            ref={input}
            autoFocus
            onKeyDown={(e) => {
              if (e.code === 'Enter' && typedCorrectly === undefined) {
                handleCheck()
                e.stopPropagation()
              }
            }}
            disabled={typedCorrectly !== undefined}
            spellCheck={false}
          />
        </FlexVCenter>
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
          <FlexVCenter>
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
          </FlexVCenter>
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

const FlexVCenter = styled('div', {
  display: 'flex',
  alignItems: 'center',
})

const ResultForm = styled(Form, {
  flex: '0px 1 1',
})

const AnswerHolder = styled('div', {
  position: 'relative',
  marginTop: 28,
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
  boxShadow: '0 4px 4px 0 rgba(183, 183, 183, 0.25)',

  '&::placeholder': {
    color: 'rgb(172, 172, 172)',
  },

  '&:focus-visible': {
    outline: 'none',
    boxShadow: 'inset 0 0 0 1px rgb(200, 200, 200)',
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

const LetterButtonsHolder = styled('div', {
  position: 'absolute',
  transform: 'translateX(calc(-100% - 8px))',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,

  '@media (max-width: 960px)': {
    display: 'none',
  },
})

const FlashcardMetadata = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 20,
})
