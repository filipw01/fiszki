import { styled } from '~/styles/stitches.config'

export const LetterButton = ({
  letter,
  onClick,
}: {
  letter: string
  onClick: (letter: string) => void
}) => {
  return (
    <StyledLetterButton type="button" onClick={() => onClick(letter)}>
      {letter}
    </StyledLetterButton>
  )
}

const StyledLetterButton = styled('button', {
  display: 'block',
  width: '100%',
  background: '#fff',
  borderRadius: '6px',
  border: '0.5px solid black',
  padding: '4px 8px',
  margin: 0,
  cursor: 'pointer',
  boxShadow: '0 4px 4px 0 rgba(183, 183, 183, 0.25)',

  '&:hover, &:focus-visible': {
    backgroundColor: '#eee',
  },
})
