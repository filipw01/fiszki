import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import { MetaFunction } from '@remix-run/server-runtime'
import globalStyles from '~/styles/global.css'

export const meta: MetaFunction = () => {
  return { title: 'New Remix App' }
}

export default function App() {
  return (
    <html lang="en">
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
      <body>
        <div className="scaffold">
          <Link to="/" className="link-home">
            <h1>Fiszki</h1>
          </Link>
          <div className="content">
            <Outlet />
          </div>
          <div className="spacer" />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
