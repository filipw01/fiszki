import React from 'react'
import { LoaderFunction } from '@remix-run/server-runtime'
import { logout } from '~/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  return logout(request)
}
