import { defineConfig } from '@solidjs/start/config'
import Icons from 'unplugin-icons/vite'
import devtools from 'solid-devtools/vite'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  vite: {
    ssr: { external: ['@prisma/client'] },
    plugins: [
      devtools({
        autoname: true,
        locator: {
          targetIDE: 'webstorm',
          componentLocation: true,
          jsxLocation: true,
        },
      }),
      Icons({ compiler: 'solid' }),
    ],
  },
})
