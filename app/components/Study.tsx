import React, { useEffect, useRef, useState } from 'react'
import { Flashcard as FlashcardType } from '~/utils.server'
import { TagList } from '~/components/TagList'
import { LetterButton } from '~/components/LetterButton'
import { Button } from '~/components/Button'
import { styled } from '~/styles/stitches.config'
import { Form } from '@remix-run/react'
import { Flashcard } from './Flashcard'

interface Props {
  flashcards: FlashcardType[]
  isSet?: boolean
}

export const Study = ({ flashcards, isSet }: Props) => {
  const initialFlashcards = useRef(flashcards).current
  const flashcardsCount = initialFlashcards.length
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

  const currentFlashcard = initialFlashcards[currentFlashcardIndex]
  const nextFlashcard = () => {
    setTypedCorrectly(undefined)
    if (input.current) {
      setTimeout(() => {
        input.current?.focus()
      })
      input.current.value = ''
    }
    setCurrentFlashcardIndex((prevIndex) => prevIndex + 1)
  }

  if (currentFlashcard === undefined) {
    return isSet ? (
      <div>
        🎉 Brawo, ukończyłeś zestaw 🎉
        <Button color="check" onClick={() => window.location.reload()}>
          Następny zestaw
        </Button>
      </div>
    ) : (
      <div>Brak fiszek na ten dzień</div>
    )
  }

  const {
    id,
    front,
    back,
    tags,
    folder,
    backDescription,
    frontDescription,
    streak,
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

  return (
    <div>
      <FlashcardMetadata>
        <TagList tags={tags} folder={folder} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ marginRight: '1rem' }}>
            {currentFlashcardIndex + 1}/{flashcardsCount}
          </div>
          <div>Seria: {streak ? '🔥'.repeat(streak) : '➖'}</div>
        </div>
      </FlashcardMetadata>
      <FlashcardsHolder>
        <Flashcard
          text={front}
          example={frontDescription}
          image={frontImage}
          language={'en'/*not implemented*/}
        />
        <Flashcard
          text={back}
          example={backDescription}
          image={backImage}
          hidden={typedCorrectly === undefined}
          language={'en'/*not implemented*/}
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
                  if (input.current && typedCorrectly === undefined) {
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
          <FlexVCenter>
            <Button
              type="button"
              color="check"
              position="left"
              onClick={handleCheck}
            >
              sprawdź
            </Button>
            <Button
              position="right"
              color="skip"
              size="small"
              onClick={nextFlashcard}
            >
              pomiń
            </Button>
          </FlexVCenter>
        ) : (
          <FlexVCenter>
            {!typedCorrectly && (
              <ResultForm method="post" onSubmit={nextFlashcard}>
                <input type="hidden" name="flashcardId" value={id} />
                <Button
                  color="bad"
                  position="left"
                  name="_action"
                  value="failure"
                >
                  źle
                </Button>
              </ResultForm>
            )}
            <ResultForm method="post" onSubmit={nextFlashcard}>
              <input type="hidden" name="flashcardId" value={id} />
              <input type="hidden" name="_action" value="success" />
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
  overflow: 'auto',
  gap: 8,
  marginBottom: 20,
})
