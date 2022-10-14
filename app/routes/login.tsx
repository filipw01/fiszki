import React from 'react'
import { Form } from '@remix-run/react'
import { ActionFunction } from '@remix-run/server-runtime'
import { createUserSession, login } from '~/session.server'

export const action: ActionFunction = async ({ request }) => {
  const body = new URLSearchParams(await request.text())
  const email = body.get('email')
  const password = body.get('password')

  if (!email || !password) {
    return new Response('Missing email or password', { status: 400 })
  }

  await login({ email, password })

  return createUserSession(email, '/study')
}

export default function Login() {
  return (
    <Form method="post">
      <label htmlFor="email">Email</label>
      <input type="email" id="email" name="email" />
      <label htmlFor="password">Password</label>
      <input type="password" id="password" name="password" />
      <button type="submit">Sign up</button>
    </Form>
  )
}
