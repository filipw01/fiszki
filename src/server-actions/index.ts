import { cache} from '@solidjs/router'

export const requireUserEmail = cache(async () => {
  'use server'
}, 'email')

export const loggedOutGuard = cache(async () => {
  'use server'
}, 'loggedOutGuard')
