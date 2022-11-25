import React from 'react'
import { Link } from '@remix-run/react'
import { ActionFunction } from '@remix-run/server-runtime'
import { createUserSession, register } from '~/session.server'
import { AuthForm } from '~/components/AuthForm'
import { isNonEmptyString } from '~/utils.server'

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const email = formData.get('email')
  const password = formData.get('password')

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
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
