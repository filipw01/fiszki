import { styled } from '@stitches/react'
import catImage from '~/assets/cat.png'

type Props = {
  text: string
  image: string
  example: string
  hidden?: boolean
  correct?: boolean
}

export const Flashcard = ({ text, example, image, hidden, correct }: Props) => (
  <StyledFlashcard correct={correct}>
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
              fontSize: getLengthBasedFontSize(text.length + example.length),
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
  </StyledFlashcard>
)

const StyledImage = styled('img', {
  display: 'block',
  maxWidth: '100%',
  borderRadius: '0.5rem',
})

const StyledFlashcard = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '50%',
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
