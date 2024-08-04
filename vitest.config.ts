import { defineConfig } from 'vitest/config'
import devtools from 'solid-devtools/vite'
import Icons from 'unplugin-icons/vite'

export default defineConfig({
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
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
    ],
  },
  resolve: {
    alias: {
      '~/': '/src/',
    },
  },
})
