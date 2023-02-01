import { indexLoader, isNonEmptyString } from '~/utils.server'
import { chunk, groupBy } from 'lodash-es'
import { daysFromNow } from '~/utils'
import { A, useRouteData } from 'solid-start'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'
import { requireUserEmail } from '~/session.server'
import { createMemo, Show } from 'solid-js'
import { Button } from '~/components/Button'
import { db } from '~/db/db.server'

const MS_IN_DAY = 24 * 60 * 60 * 1000

export const flashcardsServerData = () =>
  createServerData$(async (_, event) => {
    const email = await requireUserEmail(event.request)
    return await indexLoader(email)
  })

const activeLearningSession = () =>
  createServerData$(async (_, event) => {
    const email = await requireUserEmail(event.request)
    return await db.learningSession.findUnique({
      where: {
        ownerEmail: email,
      },
      include: {
        _count: {
          select: {
            completedFlashcards: true,
            uncompletedFlashcards: true,
          },
        },
      },
    })
  })

export const routeData = () => {
  return {
    data: flashcardsServerData(),
    learningSession: activeLearningSession(),
  }
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
    if (data === undefined) return []
    return data.data()?.flashcards
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

  const [creatingLearningSession, { Form: CreateLearningSessionForm }] =
    createServerAction$(async (formData: FormData, { request }) => {
      const email = await requireUserEmail(request)
      const day = formData.get('day')
      if (!isNonEmptyString(day)) {
        throw new Error('Day for the learning session was not provided')
      }
      const dayNumber = Number(day)
      if (Number.isNaN(dayNumber)) {
        throw new Error(`Day must be a number, got "${day}"`)
      }
      const minDay =
        dayNumber > 0 ? new Date(daysFromNow(dayNumber)) : undefined
      const maxDay = new Date(daysFromNow(dayNumber + 1))
      await db.flashcard.updateMany({
        where: {
          ownerEmail: email,
          nextStudy: {
            gte: minDay,
            lt: maxDay,
          },
        },
        data: {
          lastSeen: new Date(dayNumber),
        },
      })

      const flashcardsIds = await db.flashcard.findMany({
        where: {
          ownerEmail: email,
          nextStudy: {
            gte: minDay,
            lt: maxDay,
          },
        },
        select: { id: true },
      })

      await db.learningSession.upsert({
        where: {
          ownerEmail: email,
        },
        create: {
          ownerEmail: email,
          uncompletedFlashcards: {
            connect: flashcardsIds,
          },
        },
        update: {
          uncompletedFlashcards: {
            set: flashcardsIds,
          },
          completedFlashcards: { set: [] },
        },
      })
      return redirect('/learning-session')
    })

  return (
    <div class="p-4">
      {splittingEvenly.pending && <div>Splitting evenly...</div>}
      {splittingEvenly.error && <div>{splittingEvenly.error.message}</div>}
      {creatingLearningSession.pending && (
        <div>Creating learning session...</div>
      )}
      {creatingLearningSession.error && (
        <div>{creatingLearningSession.error.message}</div>
      )}
      <Show when={data.learningSession()}>
        <div class="flex justify-between bg-white p-4 shadow-sm mb-6 rounded-lg">
          {data.learningSession()?._count.completedFlashcards}/
          {(data.learningSession()?._count.completedFlashcards ?? 0) +
            (data.learningSession()?._count.uncompletedFlashcards ?? 0)}{' '}
          learned in last session<A href="/learning-session">Continue</A>
        </div>
      </Show>
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
          <CreateLearningSessionForm>
            <input type="hidden" name="day" value={0} />
            <button>
              {todaySeenFlashcards()?.length}/{todayFlashcards()?.length}
              <div class="day__date">{Number(isoDate.slice(-2))}</div>
            </button>
          </CreateLearningSessionForm>
        </div>
        {Array(27 - normalizedCurrentWeekDay)
          .fill(undefined)
          .map((_, index) => {
            const isoDate = daysFromNow(index + 1)
            const todayFlashcards = flashcardsByNextStudy()[isoDate] ?? []
            return (
              <div class="day day--future">
                <CreateLearningSessionForm>
                  <input type="hidden" name="day" value={index + 1} />
                  <button>
                    {todayFlashcards.length}
                    <div class="day__date">{Number(isoDate.slice(-2))}</div>
                  </button>
                </CreateLearningSessionForm>
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
