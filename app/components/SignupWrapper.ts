import { styled } from '~/styles/stitches.config'

export const SignupWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',

  form: {
    padding: '2rem 3rem',
    background: '#ffffff',
    boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)',
    borderRadius: '2rem',
  },

  label: {
    display: 'block',
  },
  input: {
    display: 'block',
    margin: '0.5rem 0',
    width: '100%',
  },
  button: {
    fontSize: '1rem',
    display: 'block',
    margin: '1rem 0 1rem',
    padding: '0.25rem 0.5rem ',
    borderRadius: '0.5rem',
    background: '#3ca200',
    color: '#ffffff',
  },
})
