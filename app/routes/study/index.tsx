import { Link, NavLink, useMatches } from '@remix-run/react'
import { groupBy } from 'lodash-es'
import { Flashcard, Tag } from '~/utils.server'
import { daysFromNow } from '~/utils'
import indexStyles from '~/styles/index.css'
import { styled } from '@stitches/react'

export const links = () => {
  return [{ rel: 'stylesheet', href: indexStyles }]
}

const MS_IN_DAY = 24 * 60 * 60 * 1000

export default function Study() {
  const [, { data }] = useMatches()
  const { flashcards } = data as {
    flashcards: Flashcard[]
    tags: Tag[]
  }
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
              <div className="day day--future">
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
          Wszystkie fiszki z dzisiaj widziane
        </div>
      )}

      <SetList>
        {new Array(Math.ceil(todayFlashcards.length / 10))
          .fill(undefined)
          .map((_, index) => {
            return (
              <NavLink key={index} to={`/study/set/${index + 1}`}>
                <Set>Zestaw {index + 1}</Set>
              </NavLink>
            )
          })}
      </SetList>
    </div>
  )
}

const SetList = styled('div', {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 32,
  marginTop: '2rem',
})

const Set = styled('div', {
  display: 'grid',
  placeItems: 'center',
  backgroundColor: '#fff',
  width: 164,
  height: 214,
  padding: '1rem',
  fontSize: '2rem',
  lineHeight: '1.5',
  textAlign: 'center',
  borderRadius: 20,
  boxShadow: '0px 0px 8px 3px rgba(168, 168, 168, 0.19)',
})
