import React from 'react'
import { Form, Link } from '@remix-run/react'
import { ActionFunction } from '@remix-run/server-runtime'
import { createUserSession, register } from '~/session.server'
import { SignupWrapper } from '~/components/SignupWrapper'

export const action: ActionFunction = async ({ request }) => {
  const body = new URLSearchParams(await request.text())
  const email = body.get('email')
  const password = body.get('password')

  if (!email || !password) {
    return new Response('Missing email or password', { status: 400 })
  }

  await register({ email, password })

  return createUserSession(email, '/study')
}

export default function Signup() {
  return (
    <SignupWrapper>
      <Form method='post'>
        <label>
          Email
          <input type='email' name='email' autoComplete='' />
        </label>
        <label>
          Password
          <input type='password' name='password' />
        </label>
        <button type='submit'>Sign up</button>
        <Link to='/login'>I already have an account</Link>
      </Form>
    </SignupWrapper>
  )
}

