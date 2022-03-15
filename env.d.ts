declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SHEET_ID: string;
      GOOGLE_APPLICATION_CREDENTIALS: string;
    }
  }
}

export {};
