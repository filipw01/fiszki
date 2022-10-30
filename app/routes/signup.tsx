import React from 'react'
import { Link } from '@remix-run/react'
import { ActionFunction } from '@remix-run/server-runtime'
import { createUserSession, register } from '~/session.server'
import { AuthForm } from '~/components/AuthForm'

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
    <AuthForm>
      <AuthForm.Field type="email" name="email" label="Email" />
      <AuthForm.Field type="password" name="password" label="Password" />
      <AuthForm.Submit>Sign Up</AuthForm.Submit>
      <Link to="/login">I already have an account</Link>
    </AuthForm>
  )
}
