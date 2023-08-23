import { createSignal, For, Show, JSX } from 'solid-js'
import { A } from 'solid-start'
import { Flashcard as FlashcardType } from '~/utils.server'
import { NewFlashcard } from '../NewFlashcard/NewFlashcard'
import BinIcon from '~icons/ri/delete-bin-line'
import EditIcon from '~icons/ri/edit-2-line'
import SpeakerIcon from '~icons/ri/volume-up-line'
import styles from './TurnableFlashcard.module.css'

export const TurnableFlashcard = (props: { flashcard: FlashcardType }) => {
  const [isFront, setIsFront] = createSignal(true)
  const turn = () => setIsFront((prev) => !prev)
  const _iconSize = '24px'

  if (typeof window !== 'undefined') {
    window.speechSynthesis.getVoices()
  }
  const handleSpeak: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (
    e
  ) => {
    e.stopPropagation()
    const utterance = new SpeechSynthesisUtterance(props.flashcard.front)
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
            <For each={Array(props.flashcard.streak).fill(undefined)}>
              {() => <div class={styles.streakDot}></div>}
            </For>
          </div>
        </Show>
      </button>
      <div class={styles.buttons}>
        <ButtonWrapper color="#adb5bd" hoverColor="#e52a2a">
          {/* TODO */}
          <BinIcon height={_iconSize} width={_iconSize} />
        </ButtonWrapper>
        <ButtonWrapper color="#adb5bd" hoverColor="#6c757d">
          <A href={`/flashcards/edit/${props.flashcard.id}`}>
            <EditIcon height={_iconSize} width={_iconSize} />
          </A>
        </ButtonWrapper>
        <div class={styles.speakerWrapper}>
          <ButtonWrapper color="#729bd7" hoverColor="#3770C6">
            <button onClick={handleSpeak}>
              <SpeakerIcon height={_iconSize} width={_iconSize} />
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