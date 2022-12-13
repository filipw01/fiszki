// @refresh reload
import { Suspense } from 'solid-js'
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
  Link,
} from 'solid-start'
import './styles/app.css'
import './styles/index.css'
import './styles/global.css'

export default function Root() {
  return (
    <Html lang="en" class="h-full">
      <Head>
        <Title>SolidStart - With Auth</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Link
          rel="preload"
          href="/Comfortaa-Variable.ttf"
          as="font"
          type="font/ttf"
          crossorigin="anonymous"
        />
      </Head>
      <Body class="h-full flex flex-col" style={{ background: '#f8f8f8' }}>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading</div>}>
            <Routes>
              <FileRoutes />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </Body>
    </Html>
  )
}
