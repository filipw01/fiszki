// @refresh reload
import { Suspense } from 'solid-js'
import { Router } from '@solidjs/router'
import { MetaProvider } from '@solidjs/meta'
import { FileRoutes } from '@solidjs/start/router'
import './styles/app.css'
import './styles/index.css'
import './styles/global.css'

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Suspense fallback={<div>Loading</div>}>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
