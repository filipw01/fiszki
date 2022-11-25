import bcrypt from 'bcryptjs'
import { createCookieSessionStorage, redirect } from '@remix-run/node'
import { db } from '~/utils/db.server'
import { isNonEmptyString } from '~/utils.server'

type LoginForm = {
  email: string
  password: string
}

export async function register({ email, password }: LoginForm) {
  const passwordHash = await bcrypt.hash(password, 10)
  return await db.user.create({
    data: { email, password: passwordHash },
  })
}

export async function login({ email, password }: LoginForm) {
  const user = await db.user.findUnique({
    where: { email },
  })
  if (!user) return null
  const isCorrectPassword = await bcrypt.compare(password, user.password)
  if (!isCorrectPassword) return null
  return true
}

const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'fiszki_session',
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'))
}

export async function requireUserEmail(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request)
  const email = session.get('email')
  if (!isNonEmptyString(email)) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }
  return email
}

export async function logout(request: Request) {
  const session = await getUserSession(request)
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  })
}

export async function createUserSession(email: string, redirectTo: string) {
  const session = await storage.getSession()
  session.set('email', email)
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  })
}
