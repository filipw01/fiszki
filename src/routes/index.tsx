import { indexLoader } from '~/utils.server'
import { groupBy } from 'lodash-es'
import { daysFromNow } from '~/utils'
import {
  redirect,
  cache,
  createAsync,
  action,
  useSubmission,
} from '@solidjs/router'
import { createMemo } from 'solid-js'
import { z } from 'zod'


const MS_IN_DAY = 24 * 60 * 60 * 1000

const flashcardsServerData = async () => {
  return await indexLoader()
}

const routeData = cache(async () => {
  'use server'

  return {
    data: await flashcardsServerData(),
    folders: []
  }
}, 'index')


const createLearningSessionAction = action(async (formData: FormData) => {
  'use server'
  console.log('request')
  const schema = z.object({
    day: z.string(),

  })
  console.log(Object.fromEntries(formData.entries()))
  const { day } = schema.parse(Object.fromEntries(formData.entries()))

  const dayNumber = parseInt(day)
  z.number().parse(dayNumber)
  return redirect('/learning-session')
}, 'createLearningSession')

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
  const data = createAsync(() => routeData(), { deferStream: true })
  const flashcards = createMemo(() => {
    if (data === undefined) return []
    return data()?.data.flashcards
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

  const creatingLearningSession = useSubmission(createLearningSessionAction)

  return (
    <div class="flex h-full relative">
      <div class="overflow-auto p-4 flex-grow">
        {/*{splittingEvenly.error && <div>{splittingEvenly.error.message}</div>}*/}
        {creatingLearningSession.pending && (
          <div>Creating learning session...</div>
        )}
        {/*{creatingLearningSession.error && (*/}
        {/*  <div>{creatingLearningSession.error.message}</div>*/}
        {/*)}*/}
        <div
          class="mt-2 grid border-b border-dark-gray"
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
            <form action={createLearningSessionAction} method="post">
              <input type="hidden" name="day" value={0} />
              <button>
                {todaySeenFlashcards()?.length}/{todayFlashcards()?.length}
                <div class="day__date">{Number(isoDate.slice(-2))}</div>
              </button>
            </form>
          </div>
          {Array(27 - normalizedCurrentWeekDay)
            .fill(undefined)
            .map((_, index) => {
              const isoDate = daysFromNow(index + 1)
              const todayFlashcards = flashcardsByNextStudy()[isoDate] ?? []
              return (
                <div class="day day--future">
                  <form action={createLearningSessionAction} method="post">
                    <input type="hidden" name="day" value={index + 1} />
                    <button>
                      {todayFlashcards.length}
                      <div class="day__date">{Number(isoDate.slice(-2))}</div>
                    </button>
                  </form>
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
                <div
                  class="grid place-items-center h-full bg-white p-4 rounded-3xl text-center shadow text-3xl"
                  style="aspect-ratio: 164 / 214"
                >
                  Set {index + 1}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

