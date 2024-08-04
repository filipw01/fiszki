import { createSignal, Index, Show, JSX } from 'solid-js'
import { Flashcard as FlashcardType, isNonEmptyString } from '~/utils.server'
import { NewFlashcard } from '../NewFlashcard/NewFlashcard'
import BinIcon from '~icons/ri/delete-bin-line'
import EditIcon from '~icons/ri/edit-2-line'
import SpeakerIcon from '~icons/ri/volume-up-line'
import styles from './TurnableFlashcard.module.css'
import { requireUserEmail } from '~/server/session.server'
import { db } from '~/db/db.server'
import { deleteFlashcard as serverDeleteFlashcard } from '~/flashcard.server'
import { action, useAction } from '@solidjs/router'

const server2deleteFlashcard = action(async (id: string) => {
  'use server'

  const email = await requireUserEmail()
  if (!isNonEmptyString(id)) throw new Error('Missing data')

  await db.flashcard.findFirstOrThrow({
    where: { id, owner: { email } },
  })

  await serverDeleteFlashcard(id)
}, 'deleteFlashcard')

export const TurnableFlashcard = (props: { flashcard: FlashcardType }) => {
  const [isFront, setIsFront] = createSignal(true)
  const [isDeleting, setDeleting] = createSignal(false)
  const turn = () => setIsFront((prev) => !prev)
  const iconSize = '24px'
  let timeoutId: NodeJS.Timeout

  if (typeof window !== 'undefined') {
    window.speechSynthesis.getVoices()
  }
  const handleSpeak: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (
    e,
  ) => {
    e.stopPropagation()
    const utterance = new SpeechSynthesisUtterance(
      isFront() ? props.flashcard.front : props.flashcard.back,
    )
    let lang = isFront()
      ? props.flashcard.frontLanguage
      : props.flashcard.backLanguage
    let voice = speechSynthesis.getVoices().find((voice) => voice.lang === lang)
    if (!voice) {
      console.warn('No voice for', lang, 'trying en-US')
      lang = 'en-US'
      voice = speechSynthesis.getVoices().find((voice) => voice.lang === lang)
    }
    if (voice) {
      utterance.voice = voice
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    } else {
      console.error(`No voice for ${lang}`)
    }
  }

  const deleteFlashcardAction = useAction(server2deleteFlashcard)
  function deleteFlashcard() {
    setDeleting(true)
    timeoutId = setTimeout(async () => {
      await deleteFlashcardAction(props.flashcard.id)
    }, 2500)
  }

  function cancelDeleting() {
    clearTimeout(timeoutId)
    setDeleting(false)
  }

  return (
    <article>
      <button class={styles.card} onClick={turn}>
        <Show
          when={isFront()}
          fallback={
            <NewFlashcard
              text={props.flashcard.back}
              image={props.flashcard.backImage}
              example={props.flashcard.backDescription}
              tags={props.flashcard.tags}
              id={props.flashcard.id}
            />
          }
        >
          <NewFlashcard
            text={props.flashcard.front}
            example={props.flashcard.frontDescription}
            image={props.flashcard.frontImage}
            tags={props.flashcard.tags}
            id={props.flashcard.id}
          />
        </Show>
        <Show when={props.flashcard.streak}>
          <div class={styles.streakWrapper}>
            <Index each={Array(props.flashcard.streak).fill(undefined)}>
              {() => <div class={styles.streakDot}></div>}
            </Index>
          </div>
        </Show>
      </button>
      <div class={styles.buttons}>
        <div class={styles.binContainer}>
          <ButtonWrapper color="#adb5bd" hoverColor="#e52a2a">
            <button
              onpointerdown={deleteFlashcard}
              onpointerup={cancelDeleting}
              onpointerout={cancelDeleting}
            >
              <BinIcon height={iconSize} width={iconSize} />
            </button>
          </ButtonWrapper>
          <Show when={isDeleting()}>
            <AnimatedDots />
          </Show>
        </div>
        <ButtonWrapper color="#adb5bd" hoverColor="#6c757d">
          <a href={`/flashcards/edit/${props.flashcard.id}`}>
            <EditIcon height={iconSize} width={iconSize} />
          </a>
        </ButtonWrapper>
        <div class={styles.speakerWrapper}>
          <ButtonWrapper color="#729bd7" hoverColor="#3770C6">
            <button onClick={handleSpeak}>
              <SpeakerIcon height={iconSize} width={iconSize} />
            </button>
          </ButtonWrapper>
        </div>
      </div>
    </article>
  )
}

const ButtonWrapper = (props: {
  color: string
  hoverColor: string
  children: JSX.Element
}) => {
  return (
    <div
      class={styles.iconButton}
      style={`--color:  ${props.color}; --hover-color: ${props.hoverColor}`}
    >
      {props.children}
    </div>
  )
}

const AnimatedDots = () => {
  return (
    <div class={styles.dotsContainer}>
      <div class={styles.dot}></div>
      <div class={styles.dot}></div>
      <div class={styles.dot}></div>
      <div class={styles.dot}></div>
      <div class={styles.dot}></div>
    </div>
  )
}
