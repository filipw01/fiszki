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
import { createServerAction$ } from 'solid-start/server'
import { requireUserEmail } from '~/session.server'
import { db } from '~/db/db.server'
import { createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { isServer } from 'solid-js/web'

interface Props {
  flashcards: FlashcardType[]
}

export const Study = (props: Props) => {
  const [isSubmitting, { Form }] = createServerAction$(
    async (form: FormData, { request }) => {
      const email = await requireUserEmail(request)
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
    },
    {
      invalidate: [], // we want to keep today's flashcards already fetched
    }
  )
  const flashcardsCount = createMemo(() => props.flashcards.length)
  let input: HTMLTextAreaElement | undefined
  const [typedCorrectly, setTypedCorrectly] = createSignal<boolean | null>(null)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = createSignal(0)

  const currentFlashcard = createMemo(
    () => props.flashcards[currentFlashcardIndex()]
  )

  const nextFlashcard = () => {
    setTypedCorrectly(null)
    if (input) {
      setTimeout(() => {
        input?.focus()
      })
      input.value = ''
    }
    setCurrentFlashcardIndex((prevIndex) => prevIndex + 1)
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
    <Show
      when={currentFlashcard() !== undefined}
      fallback={<div>No flashcards left</div>}
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
            text={currentFlashcard().front}
            example={currentFlashcard().frontDescription}
            image={currentFlashcard().frontImage}
            language={'en' /*not implemented*/}
            id={currentFlashcard().id}
          />
          <Flashcard
            id={currentFlashcard().id}
            text={currentFlashcard().back}
            example={currentFlashcard().backDescription}
            image={currentFlashcard().backImage}
            hidden={typedCorrectly() === null}
            language={'en' /*not implemented*/}
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
                      value.substring(0, start) + letter + value.substring(end)
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
                onClick={nextFlashcard}
              >
                skip
              </Button>
            </div>
          ) : (
            <div class="flex">
              {isSubmitting.pending && <div>Submitting...</div>}
              {isSubmitting.error && (
                <div>Error: {isSubmitting.error.message}</div>
              )}
              {!typedCorrectly() && (
                <Form
                  class="basis-0 flex-grow flex-shrink"
                  onSubmit={nextFlashcard}
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
                </Form>
              )}
              <Form
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
              </Form>
            </div>
          )}
        </div>
      </div>
    </Show>
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
