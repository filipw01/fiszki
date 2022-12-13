import catImage from '~/assets/cat.png'
import { SpeakerIcon } from '~/components/SpeakerIcon'
import { TagList } from '~/components/TagList'
import { Tag } from '~/utils.server'
import { A } from 'solid-start'
import { createMemo, JSX, Show } from 'solid-js'

type Props = {
  id: string
  text: string
  image?: string | null
  example?: string | null
  hidden?: boolean
  correct?: boolean
  language?: 'en' | 'es'
  isEditable?: boolean
  onClick?: () => void
  tags?: Tag[]
}

export const Flashcard = (props: Props) => {
  const handleSpeak: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (
    e
  ) => {
    e.stopPropagation()
    const utterance = new SpeechSynthesisUtterance(props.text)
    const lang = props.language === 'es' ? 'es-ES' : 'en-GB'
    const voice =
      speechSynthesis.getVoices().find((voice) => voice.lang === lang) ??
      speechSynthesis.getVoices().find((voice) => voice.lang === 'en-US')
    if (voice) {
      utterance.voice = voice
      window.speechSynthesis.speak(utterance)
    } else {
      console.log(`No voice for ${lang}`)
    }
  }

  const border = createMemo(() =>
    props.correct === undefined
      ? undefined
      : props.correct
      ? '3px solid rgba(138, 201, 38, 1)'
      : '3px solid rgba(218, 80, 5, 1)'
  )
  return (
    <div
      class="relative flex flex-col justify-center items-center basis-1/2 rounded-3xl p-4 lg:p-8 text-center shadow bg-white aspect-square break-words lg:text-5xl text-2xl leading-normal lg:leading-normal"
      style={`border: ${border()}`}
      onClick={props.onClick}
    >
      {props.isEditable && (
        <div class="absolute top-2 right-2 text-sm lg:text-lg">
          <A href={`/flashcards/edit/${props.id}`}>Edit</A>
        </div>
      )}
      <ConditionalButton onClick={props.onClick}>
        <Show
          when={!props.hidden}
          fallback={<img class="w-1/3 mx-auto" src={catImage} alt="" />}
        >
          <Show when={props.image}>
            <img
              class="block max-w-full min-h-0 rounded-lg"
              src={props.image!}
              alt=""
            />
          </Show>
          <Show when={props.text}>
            <div
              style={`margin-top: ${
                props.image ? '1rem' : 0
              }; font-weight: ${getTextLengthBasedFontWeight(
                props.text
              )}; font-size: ${getLengthBasedFontSize(
                props.text.length + (props.example?.length ?? 0)
              )}`}
            >
              {props.text}
            </div>
          </Show>
          <Show when={props.example}>
            <div
              class="text-dark-gray"
              style={`font-size: ${getLengthBasedFontSize(
                props.text.length + props.example!.length,
                true
              )}`}
            >
              <hr />
              {props.example}
            </div>
          </Show>
        </Show>
      </ConditionalButton>
      <Show
        when={!props.hidden && props.text && props.text.split(' ').length <= 5}
      >
        <button
          style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}
          onClick={handleSpeak}
        >
          <SpeakerIcon />
        </button>
      </Show>
      <Show when={props.tags}>
        <div class="absolute bottom-4 left-4">
          <TagList tags={props.tags!} size="small" />
        </div>
      </Show>
    </div>
  )
}

const ConditionalButton = ({
  children,
  onClick,
}: {
  children: JSX.Element
  onClick?: () => void
}) => {
  if (onClick) {
    return <button>{children}</button>
  }
  return <div>{children}</div>
}

const getTextLengthBasedFontWeight = (text: string) =>
  text.split(' ').length > 5 ? undefined : 700

const getLengthBasedFontSize = (length: number, isSubtitle = false) => {
  const base = 7 + Math.max(6 * ((120 - length) / 120), 0)
  const px = isSubtitle ? base - 1 : base
  const vw = isSubtitle ? 1.5 : 1.75
  return `calc(${vw}vw + ${px}px)`
}
