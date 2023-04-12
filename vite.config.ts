/// <reference types="vitest" />
import { defineConfig } from 'vite'
import Icons from 'unplugin-icons/vite'
import solid from 'solid-start/vite'
import devtools from 'solid-devtools/vite'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  plugins: [
    devtools({
      autoname: true,
      locator: {
        targetIDE: 'webstorm',
        componentLocation: true,
        jsxLocation: true,
      },
    }),
    solid(),
    Icons({ compiler: 'solid' }),
  ],
  ssr: { external: ['@prisma/client'] },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
    ],
  },
})
