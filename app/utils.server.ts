import { ActionFunction, json } from '@remix-run/server-runtime'
import { google, sheets_v4 } from 'googleapis'
import { isEqual } from 'lodash-es'
import { daysFromNow } from './utils'
import Sheets = sheets_v4.Sheets

export interface Flashcard {
  id: number
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

export interface Tag {
  name: string
  color: {
    r: number
    g: number
    b: number
  }
}

const getRange = (from: string, to?: string, sheet = 'Fiszki') => {
  if (process.env.NODE_ENV === 'development') {
    const originalColumnFrom = from.charCodeAt(0)
    const offsetColumnFrom = String.fromCharCode(originalColumnFrom + 15)
    const baseRange = `${sheet}!${offsetColumnFrom}${from.slice(1)}`
    if (!to) {
      return baseRange
    }
    const originalColumnTo = to.charCodeAt(0)
    const offsetColumnTo = String.fromCharCode(originalColumnTo + 15)
    return `${baseRange}:${offsetColumnTo}${to.slice(1)}`
  }
  const toRange = to ? `:${to}` : ''
  return `${sheet}!${from}${toRange}`
}

const getTags = async (sheets: Sheets): Promise<Tag[]> => {
  const [tagsResponse, tagColorsResponse] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: getRange('A2', 'A1000', 'Tagi'),
    }),
    sheets.spreadsheets.get({
      spreadsheetId: process.env.SHEET_ID,
      ranges: [getRange('B2', 'B100', 'Tagi')],
      includeGridData: true,
    }),
  ])
  const tagNamesRange = tagsResponse.data
  const tagsSheet = tagColorsResponse.data.sheets?.[0]

  if (!tagNamesRange.values || !tagsSheet) {
    throw new Error('Wrong data received from spreadsheet')
  }

  const tagColors =
    (tagsSheet.data?.[0].rowData?.map(
      (row) => row.values?.[0].effectiveFormat?.backgroundColor
    ) as Array<{
      red: number
      green: number
      blue: number
    }>) ?? []
  const tagNames: string[] = tagNamesRange.values.flat()
  return tagNames.map((name, index) => {
    const { red = 0, green = 0, blue = 0 } = tagColors[index]
    return {
      name,
      color: {
        r: red * 255,
        g: green * 255,
        b: blue * 255,
      },
    }
  })
}

const getFlashcards = async (sheets: Sheets): Promise<Flashcard[]> => {
  const flashcardsData = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range,
  })
  if (!flashcardsData.data.values) {
    throw new Error('No data received from spreadsheet')
  }

  const flashcardsDataWithDefaults = flashcardsData.data.values.map(
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

  if (!isEqual(flashcardsData.data.values, flashcardsDataWithDefaults)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: flashcardsDataWithDefaults,
      },
    })
  }

  return flashcardsDataWithDefaults.map(
    (
      [
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
      ],
      index
    ): Flashcard => {
      const [folder, ...tags] = tagsList
        .split(';')
        .map((tag: string) => tag.trim())
      return {
        id: index,
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

  const [flashcards, tags] = await Promise.all([
    getFlashcards(sheets),
    getTags(sheets),
  ])

  return json({ flashcards, tags })
}

const actionSuccess = async (flashcardId: number) => {
  const recordIndex = flashcardId + 2
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({
    version: 'v4',
    auth,
  })
  const values = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: getRange(`I${recordIndex}`),
  })

  if (!values.data.values) {
    throw new Error('No data received from spreadsheet')
  }

  const hotStreak = Number(values.data.values[0][0])
  const numberOfDays = getNumberOfDays(hotStreak)

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: getRange(`I${recordIndex}`, `K${recordIndex}`),
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [Number(values.data.values[0][0]) + 1, daysFromNow(numberOfDays), 0],
      ],
    },
  })
}

const actionFailure = async (flashcardId: number) => {
  const recordIndex = flashcardId + 2

  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({
    version: 'v4',
    auth,
  })

  const values = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: getRange(`J${recordIndex}`),
  })

  if (!values.data.values) {
    throw new Error('No data received from spreadsheet')
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: getRange(`I${recordIndex}`, `K${recordIndex}`),
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

export const studyAction: ActionFunction = async ({ request }) => {
  const body = await request.formData()
  const id = Number(body.get('flashcardId'))
  const action = body.get('action')

  if (id) {
    if (action === 'success') {
      await actionSuccess(id)
    }
    if (action === 'failure') {
      await actionFailure(id)
    }
  }
  return null
}
