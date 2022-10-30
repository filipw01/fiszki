import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { RemixBrowser } from '@remix-run/react'

const root = hydrateRoot(document, <RemixBrowser />)
