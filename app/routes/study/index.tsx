import { Link, NavLink, useMatches } from '@remix-run/react'
import { groupBy, partition } from 'lodash-es'
import { Flashcard } from '~/utils.server'
import { daysFromNow } from '~/utils'
import indexStyles from '~/styles/index.css'
import { requireUserEmail } from '~/session.server'
import { LoaderFunction } from '@remix-run/server-runtime'

export const links = () => {
  return [{ rel: 'stylesheet', href: indexStyles }]
}

export const loader: LoaderFunction = async ({ request }) => {
  return await requireUserEmail(request)
}

const MS_IN_DAY = 24 * 60 * 60 * 1000

export default function Study() {
  const [, { data }] = useMatches()
  const { flashcards } = data as {
    flashcards: Flashcard[]
  }
  const flashcardsByNextStudy = groupBy(flashcards, 'nextStudy')

  const currentWeekDay = new Date(Date.now()).getDay()
  const normalizedCurrentWeekDay = (currentWeekDay + 6) % 7
  const weekDayNames = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  const isoDate = daysFromNow(0)
  const todayFlashcards = flashcards.filter(
    (flashcard) =>
      new Date(flashcard.nextStudy).getTime() <= new Date(isoDate).getTime()
  )
  const [todaySeenFlashcards, todayNotSeenFlashcards] = partition(
    todayFlashcards,
    (flashcard) =>
      flashcard.lastSeen >
      new Date(new Date().toISOString().slice(0, 10)).getTime()
  )

  const seenFlashcardsToday = todayFlashcards.filter(
    (flashcard) =>
      flashcard.lastSeen >
      new Date(new Date().toISOString().slice(0, 10)).getTime()
  )
  return (
    <div className="p-4">
      <div className="calendar">
        {weekDayNames.map((weekDayName) => (
          <p key={weekDayName} className="calendar__header-cell">
            {weekDayName}
          </p>
        ))}
        {Array(normalizedCurrentWeekDay)
          .fill(undefined)
          .map((_, index) => {
            const day = new Date(
              Date.now() - (normalizedCurrentWeekDay - index) * MS_IN_DAY
            )
            return (
              <div key={index} className="day day--past">
                <div className="day__date">{day.getDate()}</div>
              </div>
            )
          })}
        <div className="day day--present">
          <Link to={`/study/${isoDate}`}>
            {seenFlashcardsToday.length}/{todayFlashcards.length}
            <div className="day__date">{Number(isoDate.slice(-2))}</div>
          </Link>
        </div>
        {Array(27 - normalizedCurrentWeekDay)
          .fill(undefined)
          .map((_, index) => {
            const isoDate = daysFromNow(index + 1)
            const todayFlashcards = flashcardsByNextStudy[isoDate] ?? []
            return (
              <div key={isoDate} className="day day--future">
                <Link to={`/study/${isoDate}`} key={index}>
                  {todayFlashcards.length}
                  <div className="day__date">{Number(isoDate.slice(-2))}</div>
                </Link>
              </div>
            )
          })}
      </div>
      {seenFlashcardsToday.length === todayFlashcards.length && (
        <div style={{ fontSize: '2rem', marginTop: '2rem' }}>
          All flashcards seen today!
        </div>
      )}

      <div
        className="grid mt-8 gap-8"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(164px, 1fr))' }}
      >
        {new Array(
          Math.ceil(
            (todayNotSeenFlashcards.length || todaySeenFlashcards.length) / 10
          )
        )
          .fill(undefined)
          .map((_, index) => {
            return (
              <NavLink key={index} to={`/study/set/${index + 1}`}>
                <div
                  className="grid place-items-center h-full bg-white p-4 rounded-3xl text-center shadow text-3xl"
                  style={{ aspectRatio: '164 / 214' }}
                >
                  Set {index + 1}
                </div>
              </NavLink>
            )
          })}
      </div>
    </div>
  )
}
