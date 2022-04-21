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
import { getCssText } from '~/styles/stitches.config'
import { useContext, useEffect } from 'react'
import ClientStyleContext from '~/styles/client.context'

export const meta: MetaFunction = () => {
  return { title: 'Fiszki' }
}

export default function App() {
  const clientStyleData = useContext(ClientStyleContext)

  // Only executed on client
  useEffect(() => {
    // reset cache to re-apply global styles
    clientStyleData.reset()
  }, [clientStyleData])
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
        <style
          id="stitches"
          dangerouslySetInnerHTML={{ __html: clientStyleData.sheet }}
          suppressHydrationWarning
        />
      </head>
      <body>
        <div className="scaffold">
          <div className="link-home">
            <Link to="/study">
              <h1>Fiszki</h1>
            </Link>
          </div>
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
