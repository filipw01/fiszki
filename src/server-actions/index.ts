import {
  requireUserEmail as requireUserEmailRaw,
  isUserLoggedIn,
} from '~/server/session.server'
import { cache, redirect } from '@solidjs/router'

export const requireUserEmail = cache(async () => {
  'use server'
  return requireUserEmailRaw()
}, 'email')

export const loggedOutGuard = cache(async () => {
  'use server'
  if (await isUserLoggedIn()) {
    throw redirect('/')
  }
  return null
}, 'loggedOutGuard')
