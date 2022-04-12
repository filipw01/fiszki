import { json } from '@remix-run/server-runtime'
import { google } from 'googleapis'
import { isEqual } from 'lodash'
import { daysFromNow } from './utils'

export interface Flashcard {
  front: string
  frontImage: string
  frontExample: string
  back: string
  backImage: string
  backExample: string
  folder: string
  tags: string[]
  isDoubleSided: 'FALSE' | 'TRUE'
  hotStreak: number
  nextStudy: string
  lastSeen: number
}

const getRange = (from: string, to?: string) => {
  if (process.env.NODE_ENV === 'development') {
    const originalColumnFrom = from.charCodeAt(0)
    const offsetColumnFrom = String.fromCharCode(originalColumnFrom + 15)
    const baseRange = `Fiszki!${offsetColumnFrom}${from.slice(1)}`
    if (!to) {
      return baseRange
    }
    const originalColumnTo = to.charCodeAt(0)
    const offsetColumnTo = String.fromCharCode(originalColumnTo + 15)
    return `${baseRange}:${offsetColumnTo}${to.slice(1)}`
  }
  const toRange = to ? `:${to}` : ''
  return `Fiszki!${from}${toRange}`
}

const range = getRange('A2', 'K1000')

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
      frontImage,
      back,
      backExample,
      backImage,
      folder,
      isDoubleSided,
      hotStreak,
      nextStudy,
      lastSeen,
    ]) => {
      const now = daysFromNow(0)
      const [updatedNextStudy, updatedLastSeen] =
        nextStudy === undefined ||
        new Date(nextStudy).getTime() < new Date(now).getTime()
          ? [now, 0]
          : [nextStudy, lastSeen]
      return [
        front,
        frontExample,
        frontImage,
        back,
        backExample,
        backImage,
        folder,
        isDoubleSided,
        hotStreak ?? 0,
        updatedNextStudy,
        updatedLastSeen,
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

  const flashcards = newValues.map(
    ([
      front,
      frontExample,
      frontImage,
      back,
      backExample,
      backImage,
      tagsList,
      isDoubleSided,
      hotStreak,
      nextStudy,
      lastSeen,
    ]): Flashcard => {
      const [folder, ...tags] = tagsList
        .split(';')
        .map((tag: string) => tag.trim())
      return {
        front,
        frontImage,
        frontExample,
        back,
        backImage,
        backExample,
        folder,
        tags,
        isDoubleSided,
        hotStreak: Number(hotStreak),
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
    range: getRange(`I${flashcardIndex}`),
  })

  if (!values.data.values) {
    throw new Error('No data received from spreadsheet')
  }

  const hotStreak = Number(values.data.values[0][0])
  const numberOfDays = getNumberOfDays(hotStreak)

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: getRange(`I${flashcardIndex}`, `K${flashcardIndex}`),
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
    range: getRange(`J${flashcardIndex}`),
  })

  if (!values.data.values) {
    throw new Error('No data received from spreadsheet')
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: getRange(`I${flashcardIndex}`, `K${flashcardIndex}`),
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
