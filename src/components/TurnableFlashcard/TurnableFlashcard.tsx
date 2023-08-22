import { createSignal, Show } from 'solid-js'
import { Flashcard } from '~/components/Flashcard'
import { Flashcard as FlashcardType } from '~/utils.server'
import styles from './TurnableFlashcard.module.css'

export const TurnableFlashcard = (props: { flashcard: FlashcardType }) => {
  const [isFront, setIsFront] = createSignal(true)
  const turn = () => setIsFront((prev) => !prev)
  return (
    <div class={`${styles.wrapper} rounded-3xl`}>
      <Show
        when={isFront()}
        fallback={
          <Flashcard
            onClick={turn}
            text={props.flashcard.back}
            image={props.flashcard.backImage}
            example={props.flashcard.backDescription}
            tags={props.flashcard.tags}
            id={props.flashcard.id}
            language={props.flashcard.backLanguage}
          />
        }
      >
        <Flashcard
          onClick={turn}
          text={props.flashcard.front}
          example={props.flashcard.frontDescription}
          image={props.flashcard.frontImage}
          tags={props.flashcard.tags}
          id={props.flashcard.id}
          isEditable
          streak={props.flashcard.streak}
          language={props.flashcard.frontLanguage}
        />
      </Show>
    </div>
  )
}
