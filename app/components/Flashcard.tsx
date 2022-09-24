import { styled } from '~/styles/stitches.config'
import catImage from '~/assets/cat.png'
import { SpeakerIcon } from '~/components/SpeakerIcon'
import { MouseEventHandler } from 'react'
import { TagList } from '~/components/TagList'
import { Tag } from '~/utils.server'

type Props = {
  text: string
  image: string
  example: string
  hidden?: boolean
  correct?: boolean
  language?: 'en' | 'es'
  onClick?: () => void
  tags?: string[]
  tagsData?: Tag[]
}

export const Flashcard = ({
  text,
  example,
  image,
  hidden,
  correct,
  language,
  onClick,
  tags,
  tagsData,
}: Props) => {
  const handleSpeak: MouseEventHandler<unknown> = (e) => {
    e.stopPropagation()
    const utterance = new SpeechSynthesisUtterance(text)
    const lang = language === 'es' ? 'es-ES' : 'en-GB'
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
  return (
    <StyledFlashcard correct={correct} onClick={onClick}>
      <StyledNode as={onClick ? 'button' : undefined}>
        {hidden ? (
          <div>
            <img style={{ width: '30%' }} src={catImage} alt="" />
          </div>
        ) : (
          <>
            {image && <StyledImage src={image} alt="" />}
            {text && (
              <div
                style={{
                  marginTop: image ? '1rem' : 0,
                  fontWeight: getTextLengthBasedFontWeight(text),
                  fontSize: getLengthBasedFontSize(
                    text.length + example.length
                  ),
                }}
              >
                {text}
              </div>
            )}
            {example && (
              <FlashcardExample
                style={{
                  fontSize: getLengthBasedFontSize(
                    text.length + example.length,
                    true
                  ),
                }}
              >
                <hr />
                {example}
              </FlashcardExample>
            )}
          </>
        )}
      </StyledNode>
      {!hidden && text && text.split(' ').length <= 5 && (
        <button
          style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}
          onClick={handleSpeak}
        >
          <SpeakerIcon />
        </button>
      )}
      {tags && tagsData && (
        <StyledTagListContainer>
          <TagList tags={tags} tagsData={tagsData} size="small" />
        </StyledTagListContainer>
      )}
    </StyledFlashcard>
  )
}

const StyledNode = styled('div', {})

const StyledTagListContainer = styled('div', {
  position: 'absolute',
  bottom: '1rem',
  left: '1rem',
})

const StyledImage = styled('img', {
  display: 'block',
  maxWidth: '100%',
  minHeight: 0,
  borderRadius: '0.5rem',
})

const StyledFlashcard = styled('div', {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  flexBasis: '50%',
  borderRadius: 16,
  padding: 32,
  textAlign: 'center',
  fontSize: 50,
  boxShadow: '0 4px 4px 0 rgba(168, 168, 168, 0.25)',
  wordBreak: 'break-word',
  background: 'white',
  aspectRatio: 1,
  '@media (max-width: 960px)': {
    padding: 16,
    fontSize: 24,
  },

  variants: {
    correct: {
      true: {
        border: '3px solid rgba(138, 201, 38, 1)',
      },
      false: {
        border: '3px solid rgba(218, 80, 5, 1)',
      },
    },
  },
})
const FlashcardExample = styled('div', {
  color: 'rgb(96, 96, 96)',
})

const getTextLengthBasedFontWeight = (text: string) =>
  text.split(' ').length > 5 ? undefined : 700

const getLengthBasedFontSize = (length: number, isSubtitle = false) => {
  const base = 7 + Math.max(6 * ((120 - length) / 120), 0)
  const px = isSubtitle ? base - 1 : base
  const vw = isSubtitle ? 1.5 : 1.75
  return `calc(${vw}vw + ${px}px)`
}
