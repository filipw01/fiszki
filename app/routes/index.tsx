import indexStyles from '~/styles/index.css'
import { Link, LoaderFunction, useLoaderData } from 'remix'
import { Flashcard, indexLoader } from '~/utils.server'
import { groupBy } from 'lodash'

export const loader: LoaderFunction = async () => {
  return indexLoader()
}

export const links = () => {
  return [{ rel: 'stylesheet', href: indexStyles }]
}

const MS_IN_DAY = 24 * 60 * 60 * 1000

export default function Index() {
  const flashcards = useLoaderData<Flashcard>()
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

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Fiszki</h1>
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
        {Array(28 - normalizedCurrentWeekDay)
          .fill(undefined)
          .map((_, index) => {
            const isoDate = new Date(Date.now() + index * MS_IN_DAY)
              .toISOString()
              .slice(0, 10)
            const todayFlashcards = flashcardsByNextStudy[isoDate] ?? []
            return (
              <Link
                to={`/${isoDate}`}
                key={index}
                className={index === 0 ? 'day day--present' : 'day day--future'}
              >
                {todayFlashcards.length}
                <div className="day__date">{Number(isoDate.slice(-2))}</div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
