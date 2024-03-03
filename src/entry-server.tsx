import { createHandler, StartServer } from '@solidjs/start/server'

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" class="h-full">
        <head>
          <title>Fiszki</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossorigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400..700&display=swap"
            rel="stylesheet"
          />
          {assets}
        </head>
        <body class="h-full">
          <div
            id="app"
            class="h-full flex flex-col"
            style={{ background: '#f8f8f8' }}
          >
            {children}
          </div>
          {scripts}
        </body>
      </html>
    )}
  />
))
