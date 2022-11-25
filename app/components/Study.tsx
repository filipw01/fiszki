import React, { useEffect, useRef, useState } from 'react'
import { Flashcard as FlashcardType } from '~/utils.server'
import { TagList } from '~/components/TagList'
import { LetterButton } from '~/components/LetterButton'
import { Button } from '~/components/Button'
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
        🎉 Congratulations, you've completed the set 🎉
        <Button color="check" onClick={() => window.location.reload()}>
          Next set
        </Button>
      </div>
    ) : (
      <div>No flashcards left</div>
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
    <div className="max-w-3xl mx-auto py-3">
      <div className="flex items-center justify-between overflow-auto gap-2 mb-5">
        <TagList tags={tags} folder={folder} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ marginRight: '1rem' }}>
            {currentFlashcardIndex + 1}/{flashcardsCount}
          </div>
          <div>Streak: {streak ? '🔥'.repeat(streak) : '➖'}</div>
        </div>
      </div>
      <div className="flex items-center gap-x-4 lg:gap-x-8">
        <Flashcard
          text={front}
          example={frontDescription}
          image={frontImage}
          language={'en' /*not implemented*/}
          id={id}
        />
        <Flashcard
          id={id}
          text={back}
          example={backDescription}
          image={backImage}
          hidden={typedCorrectly === undefined}
          language={'en' /*not implemented*/}
          correct={typedCorrectly}
        />
      </div>

      <div className="relative mt-7">
        <div
          style={{ transform: 'translateX(calc(-100% - 8px))' }}
          className="hidden absolute lg:flex flex-col gap-1"
        >
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
        </div>
        <textarea
          className="block py-6 px-7 -mr-2 h-48 w-full bg-white rounded-t-3xl shadow text-xl resize-none placeholder-dark-gray focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dark-gray focus-visible:ring-inset"
          style={{
            color:
              typedCorrectly === undefined
                ? undefined
                : typedCorrectly
                ? 'rgb(138, 201, 38)'
                : 'rgb(218, 80, 5)',
          }}
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
        {typedCorrectly === undefined ? (
          <div className="flex">
            <Button
              type="button"
              color="check"
              position="left"
              onClick={handleCheck}
            >
              check
            </Button>
            <Button
              position="right"
              color="skip"
              size="small"
              onClick={nextFlashcard}
            >
              skip
            </Button>
          </div>
        ) : (
          <div className="flex">
            {!typedCorrectly && (
              <Form
                className="basis-0 flex-grow flex-shrink"
                method="post"
                onSubmit={nextFlashcard}
              >
                <input type="hidden" name="flashcardId" value={id} />
                <Button
                  color="bad"
                  position="left"
                  name="_action"
                  value="failure"
                >
                  wrong
                </Button>
              </Form>
            )}
            <Form
              className="basis-0 flex-grow flex-shrink"
              method="post"
              onSubmit={nextFlashcard}
            >
              <input type="hidden" name="flashcardId" value={id} />
              <input type="hidden" name="_action" value="success" />
              {typedCorrectly ? (
                <Button
                  color="good"
                  position="standalone"
                  ref={goodButtonTypedCorrectly}
                >
                  Correct, great job 🤩
                </Button>
              ) : (
                <Button color="good" position="right">
                  correct
                </Button>
              )}
            </Form>
          </div>
        )}
      </div>
    </div>
  )
}
