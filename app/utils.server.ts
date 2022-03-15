import { google } from 'googleapis'
import { isEqual } from 'lodash'
import { json } from 'remix'

export interface Flashcard {
  front: string
  frontExample: string
  back: string
  backExample: string
  folder: string
  isDoubleSided: 'FALSE' | 'TRUE'
  hotStreak: string
  nextStudy: string
}

const range = 'Fiszki!A2:H1000'

export const indexLoader = async () => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({
    version: 'v4',
    auth,
  })

  const values = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range,
  })

  if (!values.data.values) {
    throw new Error('No data received from spreadsheet')
  }

  const newValues = values.data.values.map(
    ([
      front,
      frontExample,
      back,
      backExample,
      folder,
      isDoubleSided,
      hotStreak,
      nextStudy,
    ]) => {
      const now = new Date().toISOString().slice(0, 10)
      const updatedNextStudy =
        nextStudy === undefined ||
        new Date(nextStudy).getTime() < new Date(now).getTime()
          ? now
          : nextStudy
      return [
        front,
        frontExample,
        back,
        backExample,
        folder,
        isDoubleSided,
        hotStreak ?? 0,
        updatedNextStudy,
      ]
    }
  )

  if (!isEqual(values.data.values, newValues)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: newValues,
      },
    })
  }

  const flashcards: Flashcard[] | undefined = newValues.map(
    ([
      front,
      frontExample,
      back,
      backExample,
      folder,
      isDoubleSided,
      hotStreak,
      nextStudy,
    ]) => {
      return {
        front,
        frontExample,
        back,
        backExample,
        folder,
        isDoubleSided,
        hotStreak,
        nextStudy,
      }
    }
  )

  return json(flashcards)
}

export const actionSuccess = async (flashcardIndex: number) => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({
    version: 'v4',
    auth,
  })
  const values = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `Fiszki!G${flashcardIndex}`,
  })

  if (!values.data.values) {
    throw new Error('No data received from spreadsheet')
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `Fiszki!G${flashcardIndex}:H${flashcardIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          Number(values.data.values[0][0]) + 1,
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
        ],
      ],
    },
  })
}
