import { indexLoader } from '~/utils.server'
import { chunk, groupBy } from 'lodash-es'
import { daysFromNow } from '~/utils'
import { A, useRouteData } from 'solid-start'
import { createServerAction$, createServerData$ } from 'solid-start/server'
import { requireUserEmail } from '~/session.server'
import { createMemo } from 'solid-js'
import { Button } from '~/components/Button'
import { db } from '~/db/db.server'

const MS_IN_DAY = 24 * 60 * 60 * 1000

export const flashcardsServerData = () =>
  createServerData$(async (_, event) => {
    const email = await requireUserEmail(event.request)
    return await indexLoader(email)
  })

export const routeData = () => {
  return flashcardsServerData()
}

const weekDayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export default function Calendar() {
  const data = useRouteData<typeof routeData>()

  const flashcards = createMemo(() => {
    if (data() === undefined) return []
    return data()?.flashcards
  })

  const flashcardsByNextStudy = createMemo(() =>
    groupBy(flashcards(), 'nextStudy')
  )

  const currentWeekDay = new Date(Date.now()).getDay()
  const normalizedCurrentWeekDay = (currentWeekDay + 6) % 7
  const isoDate = daysFromNow(0)

  const todayFlashcards = createMemo(() => {
    return flashcards()?.filter(
      (flashcard) =>
        new Date(flashcard.nextStudy).getTime() <= new Date(isoDate).getTime()
    )
  })

  const todaySeenFlashcards = createMemo(() => {
    return todayFlashcards()?.filter(
      (flashcard) =>
        flashcard.lastSeen >
        new Date(new Date().toISOString().slice(0, 10)).getTime()
    )
  })

  const todayNotSeenFlashcards = createMemo(() => {
    return todayFlashcards()?.filter(
      (flashcard) =>
        flashcard.lastSeen <=
        new Date(new Date().toISOString().slice(0, 10)).getTime()
    )
  })

  const [splittingEvenly, { Form }] = createServerAction$(
    async (_: FormData, { request }) => {
      const email = await requireUserEmail(request)
      const flashcards = await db.flashcard.findMany({
        where: { nextStudy: { lt: new Date(daysFromNow(0)) } },
      })
      await Promise.all(
        chunk(flashcards, Math.ceil(flashcards.length / 30)).map(
          (flashcard, index) => {
            return db.flashcard.updateMany({
              where: {
                id: { in: flashcard.map((f) => f.id) },
                ownerEmail: email,
              },
              data: { nextStudy: new Date(daysFromNow(index)) },
            })
          }
        )
      )
    }
  )

  return (
    <div class="p-4">
      {splittingEvenly.pending && <div>Splitting evenly...</div>}
      {splittingEvenly.error && <div>{splittingEvenly.error.message}</div>}
      <div
        class="-mx-3 lg:m-0 mt-2 grid border-b border-dark-gray"
        style="grid-template-columns: repeat(7, 1fr); grid-template-rows: 36px repeat(4, 100px)"
      >
        {weekDayNames.map((weekDayName) => (
          <p class="text-xs text-center">{weekDayName}</p>
        ))}
        {Array(normalizedCurrentWeekDay)
          .fill(undefined)
          .map((_, index) => {
            const day = new Date(
              Date.now() - (normalizedCurrentWeekDay - index) * MS_IN_DAY
            )
            return (
              <div class="day day--past">
                <div class="day__date">{day.getDate()}</div>
              </div>
            )
          })}
        <div class="day day--present">
          <A href={`/study/${isoDate}`}>
            {todaySeenFlashcards()?.length}/{todayFlashcards()?.length}
            <div class="day__date">{Number(isoDate.slice(-2))}</div>
          </A>
        </div>
        {Array(27 - normalizedCurrentWeekDay)
          .fill(undefined)
          .map((_, index) => {
            const isoDate = daysFromNow(index + 1)
            const todayFlashcards = flashcardsByNextStudy()[isoDate] ?? []
            return (
              <div class="day day--future">
                <A href={`/study/${isoDate}`}>
                  {todayFlashcards.length}
                  <div class="day__date">{Number(isoDate.slice(-2))}</div>
                </A>
              </div>
            )
          })}
      </div>
      {todaySeenFlashcards()?.length === todayFlashcards()?.length && (
        <div style="font-size: 2rem; margin-top: 2rem">
          All flashcards seen today!
        </div>
      )}

      <div
        class="grid mt-8 gap-8"
        style="grid-template-columns: repeat(auto-fill, minmax(164px, 1fr))"
      >
        {new Array(
          Math.ceil(
            (todayNotSeenFlashcards()?.length ||
              (todaySeenFlashcards()?.length ?? 0)) / 10
          )
        )
          .fill(undefined)
          .map((_, index) => {
            return (
              <A href={`/study/set/${index + 1}`}>
                <div
                  class="grid place-items-center h-full bg-white p-4 rounded-3xl text-center shadow text-3xl"
                  style="aspect-ratio: 164 / 214"
                >
                  Set {index + 1}
                </div>
              </A>
            )
          })}
      </div>
      <Form>
        <label>
          Are you sure?
          <input type="checkbox" required checked={splittingEvenly.pending} />
        </label>
        <label>
          Are you really sure?
          <input type="checkbox" required checked={splittingEvenly.pending} />
        </label>
        <Button color="bad">Split today's flashcards evenly this month</Button>
      </Form>
    </div>
  )
}
