import { LoaderFunction } from '@remix-run/server-runtime'
import { Link, useMatches } from '@remix-run/react'
import { groupBy } from 'lodash'
import { Flashcard, indexLoader } from '~/utils.server'
import { daysFromNow } from '~/utils'
import indexStyles from '~/styles/index.css'

export const loader: LoaderFunction = async () => {
  return indexLoader()
}

export const links = () => {
  return [{ rel: 'stylesheet', href: indexStyles }]
}

const MS_IN_DAY = 24 * 60 * 60 * 1000

export default function Study() {
  const [_, { data }] = useMatches()
  const flashcards = data as Flashcard[]
  const flashcardsByNextStudy = groupBy(flashcards, 'nextStudy')

  const currentWeekDay = new Date(Date.now()).getDay()
  const normalizedCurrentWeekDay = (currentWeekDay + 6) % 7
  const weekDayNames = [
    'Poniedziałek',
    'Wtorek',
    'Środa',
    'Czwartek',
    'Piątek',
    'Sobota',
    'Niedziela',
  ]

  const isoDate = daysFromNow(0)
  const todayFlashcards = flashcardsByNextStudy[isoDate] ?? []
  const seenFlashcardsToday = todayFlashcards.filter(
    (flashcard) => flashcard.lastSeen !== 0
  )

  return (
    <div>
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
        <Link to={`/study/${isoDate}`} className="day day--present">
          {seenFlashcardsToday.length}/{todayFlashcards.length}
          <div className="day__date">{Number(isoDate.slice(-2))}</div>
        </Link>
        {Array(27 - normalizedCurrentWeekDay)
          .fill(undefined)
          .map((_, index) => {
            const isoDate = daysFromNow(index + 1)
            const todayFlashcards = flashcardsByNextStudy[isoDate] ?? []
            return (
              <Link
                to={`/study/${isoDate}`}
                key={index}
                className={'day day--future'}
              >
                {todayFlashcards.length}
                <div className="day__date">{Number(isoDate.slice(-2))}</div>
              </Link>
            )
          })}
      </div>
      {seenFlashcardsToday.length === todayFlashcards.length && (
        <div style={{ fontSize: '2rem', marginTop: '2rem' }}>
          Wszystkie fiszki z dzisiaj widziane
        </div>
      )}
    </div>
  )
}
