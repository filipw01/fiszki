import { LoaderFunction } from '@remix-run/server-runtime'
import { Outlet } from '@remix-run/react'
import { indexLoader } from '~/utils.server'
import { requireUserEmail } from '~/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  const email = await requireUserEmail(request)
  return indexLoader(email)
}

export default function Study() {
  return <Outlet />
}
