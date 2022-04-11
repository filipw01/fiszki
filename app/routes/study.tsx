import { LoaderFunction } from '@remix-run/server-runtime'
import { Outlet } from '@remix-run/react'
import { indexLoader } from '~/utils.server'

export const loader: LoaderFunction = async () => {
  return indexLoader()
}

export default function Study() {
  return <Outlet />
}
