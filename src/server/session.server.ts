import bcrypt from 'bcryptjs'
import { redirect } from '@solidjs/router'
import { db } from '~/db/db.server'
import { isNonEmptyString } from '~/utils.server'
import { useSession } from 'vinxi/http'
import * as process from 'process'

type LoginForm = {
  email: string
  password: string
}

export async function register({ email, password }: LoginForm) {
  'use server'

  const passwordHash = await bcrypt.hash(password, 10)
  return await db.user.create({
    data: { email, password: passwordHash },
  })
}

function getSession() {
  'use server'

  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET must be set')
  }
  return useSession<{ email?: string }>({
    name: 'fiszki_session',
    maxAge: 60 * 60 * 24 * 30,
    password: secret,
  })
}
export async function login({ email, password }: LoginForm) {
  'use server'

  const user = await db.user.findUnique({
    where: { email },
  })
  if (!user) return null
  const isCorrectPassword = await bcrypt.compare(password, user.password)
  if (!isCorrectPassword) return null
  return true
}

export async function isUserLoggedIn() {
  'use server'

  const session = await getSession()
  return isNonEmptyString(session.data.email)
}

export async function requireUserEmail() {
  'use server'
  // redirectTo: string = new URL(request.url).pathname
  const session = await getSession()
  const email = session.data.email
  if (!isNonEmptyString(email)) {
    // TODO: how to add redirect?
    // const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    // throw redirect(`/login?${searchParams}`)
    throw redirect(`/login`)
  }
  return email
}

export async function logout() {
  'use server'

  const session = await getSession()
  await session.update({ email: undefined })
  throw redirect('/login')
}

export async function createUserSession(email: string, redirectTo: string) {
  'use server'

  const session = await getSession()
  await session.update({ email })
  throw redirect(redirectTo)
}
