import React, { ReactNode, useCallback, useState } from 'react'
import { hydrate } from 'react-dom'
import { RemixBrowser } from '@remix-run/react'
import ClientStyleContext from './styles/client.context'
import { getCssText } from '~/styles/stitches.config'

interface ClientCacheProviderProps {
  children: ReactNode
}

function ClientCacheProvider({ children }: ClientCacheProviderProps) {
  const [sheet, setSheet] = useState(getCssText())

  const reset = useCallback(() => {
    setSheet(getCssText())
  }, [])

  return (
    <ClientStyleContext.Provider value={{ reset, sheet }}>
      {children}
    </ClientStyleContext.Provider>
  )
}

hydrate(
  <ClientCacheProvider>
    <RemixBrowser />
  </ClientCacheProvider>,
  document
)
