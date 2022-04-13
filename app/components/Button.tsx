import { styled } from '@stitches/react'

export const Button = styled('button', {
  fontSize: 20,
  width: '100%',
  padding: '16px 32px',
  margin: 0,
  backgroundColor: 'rgb(var(--primary))',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '2px solid rgb(var(--primary))',
  boxShadow: '0 4px 4px 0 rgba(183, 183, 183, 0.25)',

  '&:focus-visible, &:hover': {
    outline: 'none',
    backgroundColor: 'rgba(var(--primary), 0.2)',
    color: 'rgb(var(--primary))',
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
        '--primary': '218, 80, 5',
      },
      good: {
        '--primary': '138, 201, 38',
      },
      check: {
        '--primary': '127, 158, 52',
      },
      skip: {
        '--primary': '86, 86, 86',
      },
    },
    size: {
      small: {
        width: '20%',
        fontSize: 18,
        lineHeight: 1,
        padding: '18px 4px',
      },
    },
  },
})
