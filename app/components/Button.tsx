import { styled } from '@stitches/react'

export const Button = styled('button', {
  fontSize: 20,
  width: '100%',
  padding: '16px 32px',
  margin: 0,
  backgroundColor: 'var(--primary)',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '2px solid var(--primary)',
  boxShadow: '0 4px 4px 0 rgba(183, 183, 183, 0.25)',

  '&:focus-visible, &:hover': {
    outline: 'none',
    backgroundColor: '#fff',
    color: 'var(--primary)',
  },

  variants: {
    position: {
      left: {
        borderRadius: '0 0 0 20px',
      },
      right: {
        borderRadius: '0 0 20px 0',
      },
      standalone: {
        borderRadius: '0 0 20px 20px',
      },
    },
    color: {
      bad: {
        '--primary': 'rgb(218, 80, 5)',
      },
      good: {
        '--primary': 'rgb(138, 201, 38)',
      },
      check: {
        '--primary': 'rgb(127, 158, 52)',
      },
    },
  },
})
