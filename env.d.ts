/// <reference types="vite/client" />

interface ImportMetaEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly AWS_ACCESS_KEY_ID: string
      readonly AWS_SECRET_ACCESS_KEY: string
      readonly SESSION_SECRET: string
      readonly DATABASE_URL: string
      readonly TEST_USER: string
      readonly TEST_PASSWORD: string
    }
  }
}

export {}
