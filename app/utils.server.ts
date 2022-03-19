import { google } from 'googleapis'
import { isEqual } from 'lodash'
import { json } from 'remix'
import { daysFromNow } from './utils'

export interface Flashcard {
  front: string
  frontExample: string
  back: string
  backExample: string
  folder: string
  isDoubleSided: 'FALSE' | 'TRUE'
  hotStreak: string
  nextStudy: string
  lastSeen: number
}

const range = 'Fiszki!A2:I1000'

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
      lastSeen,
    ]) => {
      const now = daysFromNow(0)
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
        lastSeen ?? 0,
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
      lastSeen,
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
        lastSeen: Number(lastSeen),
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

  const hotStreak = Number(values.data.values[0][0])
  const numberOfDays = getNumberOfDays(hotStreak)

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `Fiszki!G${flashcardIndex}:I${flashcardIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [Number(values.data.values[0][0]) + 1, daysFromNow(numberOfDays), 0],
      ],
    },
  })
}

export const actionFailure = async (flashcardIndex: number) => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({
    version: 'v4',
    auth,
  })

  const values = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `Fiszki!H${flashcardIndex}`,
  })

  if (!values.data.values) {
    throw new Error('No data received from spreadsheet')
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `Fiszki!G${flashcardIndex}:I${flashcardIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[0, values.data.values[0][0], Date.now()]],
    },
  })
}

const randomNumber = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

const getNumberOfDays = (hotStreak: number) => {
  switch (hotStreak) {
    case 0:
      return 3
    case 1:
      return randomNumber(6, 8)
    case 2:
      return randomNumber(18, 22)
    case 3:
      return randomNumber(40, 60)
    default:
      return 99999
  }
}
