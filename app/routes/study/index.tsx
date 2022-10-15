import { Link, NavLink, useLoaderData, useMatches } from '@remix-run/react'
import { groupBy, partition } from 'lodash-es'
import { Flashcard } from '~/utils.server'
import { daysFromNow } from '~/utils'
import indexStyles from '~/styles/index.css'
import { styled } from '~/styles/stitches.config'
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
  const email = useLoaderData<string>()
  const [, { data }] = useMatches()
  const { flashcards } = data as {
    flashcards: Flashcard[]
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
  const todayFlashcards = flashcards.filter(
    (flashcard) =>
      new Date(flashcard.nextStudy).getTime() <= new Date(isoDate).getTime()
  )
  const [todaySeenFlashcards, todayNotSeenFlashcards] = partition(
    todayFlashcards,
    (flashcard) => flashcard.lastSeen > 0
  )
  const seenFlashcardsToday = todayFlashcards.filter(
    (flashcard) => flashcard.lastSeen !== 0
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/study/tag">Study Tags</Link>
        <Link to="/tags">Tags</Link>
        <Link to="/folders">Folders</Link>
        <Link to="/flashcards">Flashcards</Link>
        <Link to="/logout">Logout: {email}</Link>
      </div>
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
          Wszystkie fiszki z dzisiaj widziane
        </div>
      )}

      <SetList>
        {new Array(
          Math.ceil(
            (todayNotSeenFlashcards.length || todaySeenFlashcards.length) / 10
          )
        )
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
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(164px, 1fr))',
  flexWrap: 'wrap',
  gap: 32,
  marginTop: '2rem',
})

const Set = styled('div', {
  display: 'grid',
  placeItems: 'center',
  height: '100%',
  backgroundColor: '#fff',
  aspectRatio: 164 / 214,
  padding: '1rem',
  fontSize: '2rem',
  lineHeight: '1.5',
  textAlign: 'center',
  borderRadius: 20,
  boxShadow: '0px 0px 8px 3px rgba(168, 168, 168, 0.19)',
})
