import React from 'react'
import { Link } from '@remix-run/react'
import { ActionFunction } from '@remix-run/server-runtime'
import { createUserSession, login } from '~/session.server'
import { AuthForm } from '~/components/AuthForm'

export const action: ActionFunction = async ({ request }) => {
  const body = new URLSearchParams(await request.text())
  const email = body.get('email')
  const password = body.get('password')

  if (!email || !password) {
    throw new Response('Missing email or password', { status: 400 })
  }

  const result = await login({ email, password })
  if (result === null) {
    throw new Response('Invalid email or password', { status: 401 })
  }

  return createUserSession(email, '/study')
}

export default function Login() {
  return (
    <AuthForm>
      <AuthForm.Field type="email" name="email" label="Email" />
      <AuthForm.Field type="password" name="password" label="Password" />
      <AuthForm.Submit>Login</AuthForm.Submit>
      <Link to="/signup">I don't have an account yet</Link>
    </AuthForm>
  )
}
