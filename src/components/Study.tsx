import {
  actionFailure,
  actionSuccess,
  Flashcard as FlashcardType,
  isNonEmptyString,
} from '~/utils.server'
import { TagList } from '~/components/TagList'
import { LetterButton } from '~/components/LetterButton'
import { Button } from '~/components/base/Button'
import { Flashcard } from './Flashcard'
import { requireUserEmail } from '~/server/session.server'
import { db } from '~/db/db.server'
import { createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { isServer } from 'solid-js/web'
import { shuffle } from 'lodash-es'
import { action, useSubmission } from '@solidjs/router'

interface Props {
  flashcards: FlashcardType[]
}

const repeat = action(async () => {
  'use server'

  const email = await requireUserEmail()
  const flashcardsInSession = await db.learningSession.findFirst({
    where: {
      ownerEmail: email,
    },
    select: {
      uncompletedFlashcards: {
        select: {
          id: true,
        },
      },
    },
  })
  const shuffledFlashcards = shuffle(
    flashcardsInSession?.uncompletedFlashcards ?? []
  )
  await db.$transaction(
    shuffledFlashcards.map((flashcard, index) => {
      return db.flashcard.update({
        where: {
          id: flashcard.id,
        },
        data: {
          learningSessionSortingIndex: index,
        },
      })
    })
  )
  // TODO: probably this doesn't work without page refresh
})

const check = action(async (form: FormData) => {
  'use server'

  const email = await requireUserEmail()
  const rawFlashcardId = form.get('flashcardId')
  const id = isNonEmptyString(rawFlashcardId) ? rawFlashcardId : null
  const action = form.get('_action')
  if (id !== null) {
    db.flashcard.findFirstOrThrow({
      where: {
        id,
        owner: {
          email,
        },
      },
    })
    if (action === 'success') {
      await actionSuccess(id, email)
    }
    if (action === 'failure') {
      await actionFailure(id)
    }
  }
  return null
})
export const Study = (props: Props) => {
  const isRepeating = useSubmission(repeat)
  const isSubmitting = useSubmission(check)

  const flashcardsCount = createMemo(() => props.flashcards.length)
  let input: HTMLTextAreaElement | undefined
  const [typedCorrectly, setTypedCorrectly] = createSignal<boolean | null>(null)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = createSignal(0)

  const currentFlashcard = createMemo(
    () => props.flashcards[currentFlashcardIndex()]
  )

  const nextFlashcard = () => {
    setTypedCorrectly(null)
    setTimeout(() => {
      if (input) {
        input.value = ''
        input.focus()
      }
    })
  }

  const handleCheck = () => {
    if (
      input?.value.toLowerCase().trim() ===
        currentFlashcard().back.toLowerCase().trim() &&
      currentFlashcard().back !== ''
    ) {
      setTypedCorrectly(true)
    } else {
      setTypedCorrectly(false)
    }
  }

  return (
    <>
      <Show
        when={currentFlashcard() !== undefined}
        fallback={
          <div>
            No flashcards left
            <form
              action={repeat}
              method="post"
              onSubmit={() => setCurrentFlashcardIndex(0)}
            >
              <Show when={isRepeating.pending}>Repeating...</Show>
              <Button color="check">Rinse and repeat</Button>
            </form>
          </div>
        }
      >
        <div class="max-w-3xl mx-auto py-3">
          <div class="flex items-center justify-between overflow-auto gap-2 mb-5">
            <TagList
              tags={currentFlashcard().tags}
              folder={currentFlashcard().folder.path}
            />
            <div style={{ display: 'flex', 'align-items': 'center' }}>
              <div style={{ 'margin-right': '1rem' }}>
                {currentFlashcardIndex() + 1}/{flashcardsCount()}
              </div>
              <div>
                Streak:{' '}
                {currentFlashcard().streak
                  ? '🔥'.repeat(currentFlashcard().streak)
                  : '➖'}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-x-4 lg:gap-x-8">
            <Flashcard
              text={currentFlashcard()?.front}
              example={currentFlashcard().frontDescription}
              image={currentFlashcard().frontImage}
              language={currentFlashcard().frontLanguage}
              id={currentFlashcard().id}
            />
            <Flashcard
              id={currentFlashcard().id}
              text={currentFlashcard().back}
              example={currentFlashcard().backDescription}
              image={currentFlashcard().backImage}
              hidden={typedCorrectly() === null}
              language={currentFlashcard().backLanguage}
              correct={typedCorrectly()}
            />
          </div>

          <div class="relative mt-7">
            <div
              style={{ transform: 'translateX(calc(-100% - 8px))' }}
              class="hidden absolute lg:flex flex-col gap-1"
            >
              {['ñ', 'í', 'é', 'á', 'ú', 'ü'].map((letter) => (
                <LetterButton
                  letter={letter}
                  onClick={(letter) => {
                    if (input && typedCorrectly() === null) {
                      // insert character at cursor
                      const start = input.selectionStart
                      const end = input.selectionEnd
                      const value = input.value
                      input.value =
                        value.substring(0, start) +
                        letter +
                        value.substring(end)
                      input.focus()
                      input.selectionStart = start + 1
                      input.selectionEnd = input.selectionStart
                    }
                  }}
                />
              ))}
            </div>
            <textarea
              class="block py-6 px-7 -mr-2 h-48 w-full bg-white rounded-t-3xl shadow text-xl resize-none placeholder-dark-gray focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dark-gray focus-visible:ring-inset"
              style={
                typedCorrectly() === null
                  ? undefined
                  : typedCorrectly()
                  ? 'color: rgb(138, 201, 38)'
                  : 'color: rgb(218, 80, 5)'
              }
              placeholder="Hm.."
              ref={input}
              autofocus
              onKeyDown={(e) => {
                if (e.code === 'Enter' && typedCorrectly() === null) {
                  handleCheck()
                  e.stopPropagation()
                }
              }}
              disabled={typedCorrectly() !== null}
              spellcheck={false}
            />
            {typedCorrectly() === null ? (
              <div class="flex">
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
                  onClick={() => {
                    nextFlashcard()
                    setCurrentFlashcardIndex((prevIndex) => prevIndex + 1)
                  }}
                >
                  skip
                </Button>
              </div>
            ) : (
              <div class="flex">
                {isSubmitting.pending && <div>Submitting...</div>}
                {/*{isSubmitting.error && (*/}
                {/*  <div>Error: {isSubmitting.error.message}</div>*/}
                {/*)}*/}
                {!typedCorrectly() && (
                  <form
                    action={check}
                    method="post"
                    class="basis-0 flex-grow flex-shrink"
                    onSubmit={() => {
                      nextFlashcard()
                      setCurrentFlashcardIndex((prevIndex) => prevIndex + 1)
                    }}
                  >
                    <input
                      type="hidden"
                      name="flashcardId"
                      value={currentFlashcard().id}
                    />
                    <Button
                      color="bad"
                      position="left"
                      name="_action"
                      value="failure"
                    >
                      wrong
                    </Button>
                  </form>
                )}
                <form
                  action={check}
                  method="post"
                  class="basis-0 flex-grow flex-shrink"
                  onSubmit={nextFlashcard}
                >
                  <input
                    type="hidden"
                    name="flashcardId"
                    value={currentFlashcard().id}
                  />
                  <input type="hidden" name="_action" value="success" />
                  {typedCorrectly() ? (
                    <GoodButton />
                  ) : (
                    <Button color="good" position="right">
                      correct
                    </Button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </Show>
    </>
  )
}

const GoodButton = () => {
  let goodButtonTypedCorrectly: HTMLButtonElement | undefined

  let listener = (e: KeyboardEvent) => {
    if (e.code === 'Enter') {
      goodButtonTypedCorrectly?.click()
    }
  }
  onMount(() => {
    window.addEventListener('keydown', listener)
  })

  onCleanup(() => {
    if (!isServer) {
      // TODO: why it is needed here, but not on onMount?
      window.removeEventListener('keydown', listener)
    }
  })

  return (
    <Button color="good" position="standalone" ref={goodButtonTypedCorrectly}>
      Correct, great job 🤩
    </Button>
  )
}
