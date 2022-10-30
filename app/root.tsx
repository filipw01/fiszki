import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import { MetaFunction } from '@remix-run/server-runtime'
import globalStyles from '~/styles/global.css'
import styles from './styles/app.css'
import { LoaderArgs } from '@remix-run/node'
import { requireUserEmail } from '~/session.server'

export const meta: MetaFunction = () => {
  return { title: 'Fiszki' }
}

export function links() {
  return [{ rel: 'stylesheet', href: styles }]
}

export const loader = async ({ request }: LoaderArgs) => {
  try {
    return await requireUserEmail(request)
  } catch {
    return null
  }
}

export default function App() {
  const email = useLoaderData<typeof loader>()
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={globalStyles} />
        <link
          rel="preload"
          href="/Comfortaa-Variable.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="same-origin"
        />
        <Meta />
        <Links />
      </head>
      <body className="h-full flex flex-col" style={{ background: '#f8f8f8' }}>
        {email && (
          <div className="flex justify-between bg-white px-8 py-5 shadow">
            <div className="flex gap-6">
              <Link to="/study">
                <h1>Calendar</h1>
              </Link>
              <Link to="/flashcards-new">Flashcards</Link>
              <Link to="/study/tag">Tags</Link>
              <div style={{ display: 'flex', gap: 4 }}>
                Edit:
                <div>
                  <Link to="/tags">Tags</Link>/
                  <Link to="/folders">Folders</Link>/
                  <Link to="/flashcards">Flashcards</Link>
                </div>
              </div>
            </div>
            <Link to="/logout">Logout: {email}</Link>
          </div>
        )}
        <div className="basis-0 flex-grow overflow-auto">
          <Outlet />
        </div>
        <div className="spacer" />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
