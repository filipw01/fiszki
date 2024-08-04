import { indexLoader } from '~/utils.server'
import { chunk, groupBy } from 'lodash-es'
import { clsx, daysFromNow } from '~/utils'
import {
  useParams,
  useSearchParams,
  redirect,
  cache,
  createAsync,
  action,
  useSubmission,
} from '@solidjs/router'
import { requireUserEmail } from '~/server/session.server'
import { getNestedFlashcardsCount } from '~/server/getNestedFlashcardsCount'
import { createMemo, createSignal, Show } from 'solid-js'
import { Button } from '~/components/base/Button'
import { db } from '~/db/db.server'
import { createLearningSession } from '~/service/learningSession'
import { Prisma } from '@prisma/client'
import { HeadingSmall } from '~/components/base/Heading'
import { Sidebar } from '~/components/Sidebar'
import ArrowIcon from '~icons/ri/arrow-right-s-line'
import CheckmarkIcon from '~icons/ri/check-line'
import ArrowDownIcon from '~icons/ri/arrow-down-line'
import FolderIcon from '~icons/ri/folder-line'
import { z } from 'zod'

type Folder = Prisma.FolderGetPayload<{}> & {
  flashcardsCount: number
  subfolders: Array<Folder>
}

const MS_IN_DAY = 24 * 60 * 60 * 1000

const flashcardsServerData = async () => {
  const email = await requireUserEmail()
  return await indexLoader(email)
}

const activeLearningSession = async () => {
  const email = await requireUserEmail()
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
}

const folders = async () => {
  const email = await requireUserEmail()
  const allFolders: Array<Folder> = await Promise.all(
    (
      await db.folder.findMany({
        where: {
          owner: {
            email,
          },
        },
      })
    ).map(async (folder) => {
      return {
        ...folder,
        flashcardsCount: await getNestedFlashcardsCount(folder, email),
        subfolders: [],
      }
    }),
  )
  const foldersById = Object.fromEntries(
    allFolders.map((folder) => [folder.id, folder]),
  )
  const folders: Array<Folder> = []
  for (const folder of allFolders) {
    if (folder.parentFolderId === null) {
      folders.push(folder)
    } else {
      const parent = foldersById[folder.parentFolderId]
      if (parent) {
        parent.subfolders.push(folder)
      } else {
        throw new Error(
          `Invalid folder structure, got ${JSON.stringify(
            folder,
          )}, but folder with ${folder.parentFolderId} does not exist`,
        )
      }
    }
  }
  return folders
}

const routeData = cache(async () => {
  'use server'

  return {
    data: await flashcardsServerData(),
    learningSession: await activeLearningSession(),
    folders: await folders(),
  }
}, 'index')

const splitEvenly = action(async () => {
  'use server'
  const email = await requireUserEmail()
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
      },
    ),
  )
}, 'splitEvenly')

const createLearningSessionAction = action(async (formData: FormData) => {
  'use server'
  const email = await requireUserEmail()
  const schema = z.object({
    day: z.string(),
    folders: z.string(),
  })
  const { data } = schema.safeParse(Object.fromEntries(formData.entries()))
  if (!data) {
    return new Error('Invalid form data')
  }
  const { day, folders } = data

  const dayNumber = parseInt(day)
  const { success } = z.number().safeParse(dayNumber)
  if (!success) {
    return new Error('Day must be a number')
  }
  await createLearningSession(
    email,
    dayNumber,
    folders === '' ? undefined : folders.split(','),
  )
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

const getAllSubfolders = (folder: Folder): Folder[] => {
  return folder.subfolders.reduce(
    (acc, subfolder) => [...acc, subfolder, ...getAllSubfolders(subfolder)],
    [] as Folder[],
  )
}
export default function Calendar() {
  const data = createAsync(() => routeData(), { deferStream: true })
  const [selectedFolders, setFolders] = useFolders()
  const flashcards = createMemo(() => {
    if (data === undefined) return []
    return data()?.data.flashcards.filter((flashcard) => {
      return selectedFolders().length > 0
        ? selectedFolders().includes(flashcard.folder.id)
        : true
    })
  })

  const flashcardsByNextStudy = createMemo(() =>
    groupBy(flashcards(), 'nextStudy'),
  )

  const currentWeekDay = new Date(Date.now()).getDay()
  const normalizedCurrentWeekDay = (currentWeekDay + 6) % 7
  const isoDate = daysFromNow(0)

  const todayFlashcards = createMemo(() => {
    return flashcards()?.filter(
      (flashcard) =>
        new Date(flashcard.nextStudy).getTime() <= new Date(isoDate).getTime(),
    )
  })

  const todaySeenFlashcards = createMemo(() => {
    return todayFlashcards()?.filter(
      (flashcard) =>
        flashcard.lastSeen >
        new Date(new Date().toISOString().slice(0, 10)).getTime(),
    )
  })

  const todayNotSeenFlashcards = createMemo(() => {
    return todayFlashcards()?.filter(
      (flashcard) =>
        flashcard.lastSeen <=
        new Date(new Date().toISOString().slice(0, 10)).getTime(),
    )
  })

  const splittingEvenly = useSubmission(splitEvenly)
  const creatingLearningSession = useSubmission(createLearningSessionAction)
  const handleSelect = createMemo(() => (id: string) => {
    const flatFolders = [
      ...(data()?.folders ?? []),
      ...(data()?.folders?.flatMap((folder) => getAllSubfolders(folder)) ?? []),
    ]
    const newSelectedFolder = flatFolders.find((folder) => folder.id === id)
    const subfolders = newSelectedFolder
      ? getAllSubfolders(newSelectedFolder)
      : []
    if (selectedFolders().find((folder) => folder === id)) {
      if (
        subfolders.every((subfolder) =>
          selectedFolders().find((folder) => folder === subfolder.id),
        )
      ) {
        setFolders(selectedFolders().filter((folder) => folder !== id))
      } else {
        setFolders([
          ...selectedFolders(),
          ...subfolders.map((subfolder) => subfolder.id),
        ])
      }
    } else {
      setFolders([...selectedFolders(), id])
    }
  })

  return (
    <div class="flex h-full relative">
      <Sidebar>
        <HeadingSmall>Folders</HeadingSmall>
        {data()?.folders?.map((folder) => {
          return (
            <FolderComponent
              folder={folder}
              preexistingMargin={10}
              selectedFolders={selectedFolders()}
              onSelect={handleSelect()}
            />
          )
        })}
      </Sidebar>
      <div class="overflow-auto p-4 flex-grow">
        {splittingEvenly.pending && <div>Splitting evenly...</div>}
        {creatingLearningSession.pending && (
          <div>Creating learning session...</div>
        )}
        {creatingLearningSession.result && (
          <div>{creatingLearningSession.result.message}</div>
        )}
        <Show when={data()?.learningSession}>
          <div class="flex justify-between bg-white p-4 shadow-sm mb-6 rounded-lg">
            {data()?.learningSession?._count.completedFlashcards}/
            {(data()?.learningSession?._count.completedFlashcards ?? 0) +
              (data()?.learningSession?._count.uncompletedFlashcards ?? 0)}{' '}
            learned in last session<a href="/learning-session">Continue</a>
          </div>
        </Show>
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
                Date.now() - (normalizedCurrentWeekDay - index) * MS_IN_DAY,
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
              <input
                type="hidden"
                name="folders"
                value={selectedFolders().join(',')}
              />
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
                    <input
                      type="hidden"
                      name="folders"
                      value={selectedFolders().join(',')}
                    />
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
                (todaySeenFlashcards()?.length ?? 0)) / 10,
            ),
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
        <form action={splitEvenly} method="post">
          <label>
            Are you sure?
            <input type="checkbox" required checked={splittingEvenly.pending} />
          </label>
          <label>
            Are you really sure?
            <input type="checkbox" required checked={splittingEvenly.pending} />
          </label>
          <Button color="bad">
            Split today's flashcards evenly this month
          </Button>
        </form>
      </div>
    </div>
  )
}

const FolderComponent = (props: {
  folder: Folder
  preexistingMargin: number
  selectedFolders: string[]
  onSelect: (id: string) => void
}) => {
  const params = useParams()
  const [isOpen, setIsOpen] = createSignal(true)
  const areAllSubfoldersSelected = createMemo(() => {
    return getAllSubfolders(props.folder).every((subfolder) =>
      props.selectedFolders.includes(subfolder.id),
    )
  })
  const isFolderSelected = createMemo(() => {
    return props.selectedFolders.includes(props.folder.id)
  })
  return (
    <div>
      <div
        class="flex items-center gap-1 relative"
        style={`margin-left: ${props.preexistingMargin}px; background: ${
          props.folder.id === params.folderId
            ? 'hsla(217, 100%, 96%, 1)'
            : undefined
        }`}
      >
        {props.folder.subfolders.length > 0 ? (
          <button
            onClick={() => setIsOpen((isOpen) => !isOpen)}
            class={clsx(
              'transition-transform absolute -left-1 -translate-x-full',
              {
                'rotate-90': isOpen(),
              },
            )}
          >
            <ArrowIcon class="w-3 h-3" />
          </button>
        ) : undefined}
        <label class="flex gap-2 items-center h-7">
          <div
            class={clsx('grid place-items-center grid-cols-1', {
              'text-yellow-600':
                isFolderSelected() && !areAllSubfoldersSelected(),
              'text-green-600':
                isFolderSelected() && areAllSubfoldersSelected(),
            })}
          >
            <FolderIcon class="col-start-1 row-start-1 w-5 h-5" />
            <Show when={isFolderSelected()}>
              <Show
                when={areAllSubfoldersSelected()}
                fallback={
                  <ArrowDownIcon class="col-start-1 row-start-1 w-3 h-3" />
                }
              >
                <CheckmarkIcon class="col-start-1 row-start-1 w-3 h-3" />
              </Show>
            </Show>
          </div>
          {props.folder.name}
          <div class="rounded bg-dark-gray w-0.5 h-0.5" />
          <span class="text-dark-gray">{props.folder.flashcardsCount}</span>
          <input
            class="sr-only"
            type="checkbox"
            name="folderId"
            value={props.folder.id}
            checked={
              !!props.selectedFolders.find(
                (folder) => folder === props.folder.id,
              )
            }
            onChange={() => props.onSelect(props.folder.id)}
          />
        </label>
      </div>
      <div>
        {isOpen()
          ? props.folder.subfolders.map((subfolder) => {
              return (
                <FolderComponent
                  folder={subfolder}
                  selectedFolders={props.selectedFolders}
                  onSelect={props.onSelect}
                  preexistingMargin={props.preexistingMargin + 10}
                />
              )
            })
          : undefined}
      </div>
    </div>
  )
}

const useFolders = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  return [
    createMemo(() => searchParams.folders?.split(',') ?? []),
    (folders: string[]) => setSearchParams({ folders: folders.join(',') }),
  ] as const
}
