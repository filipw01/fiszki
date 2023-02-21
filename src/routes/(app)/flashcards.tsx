import { requireUserEmail } from '~/session.server'
import { Prisma } from '@prisma/client'
import { FolderIcon } from '~/components/FolderIcon'
import { clsx } from '~/utils'
import { db } from '~/db/db.server'
import { createServerData$ } from 'solid-start/server'
import { A, Outlet, useParams, useRouteData } from 'solid-start'
import { batch, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { getNestedFlashcardsCount } from '~/routes/(app)/flashcards/folder/[folderId]'
import AddIcon from '~icons/ri/add-fill?width=16&height=16'
import MoreIcon from '~icons/ri/more-fill?width=16&height=16'

type Folder = Prisma.FolderGetPayload<{}> & {
  flashcardsCount: number
  subfolders: Array<Folder>
}

export const routeData = () =>
  createServerData$(async (_, { request }) => {
    const email = await requireUserEmail(request)
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
      })
    )
    const foldersById = Object.fromEntries(
      allFolders.map((folder) => [folder.id, folder])
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
              folder
            )}, but folder with ${folder.parentFolderId} does not exist`
          )
        }
      }
    }

    return { folders }
  })

export default function Flashcards() {
  const [selectedFolders, setSelectedFolders] = createSignal<
    Record<string, true>
  >({})

  const data = useRouteData<typeof routeData>()

  const handleSelect = createMemo(() => (id: string) => {
    const subfolders =
      data()?.folders.find((folder) => folder.id === id)?.subfolders ?? []
    if (selectedFolders()[id]) {
      if (subfolders.every((subfolder) => selectedFolders()[subfolder.id])) {
        const newSelectedFolders = { ...selectedFolders() }
        delete newSelectedFolders[id]
        setSelectedFolders(newSelectedFolders)
      } else {
        for (const subfolder of subfolders) {
          batch(() => {
            setSelectedFolders({ ...selectedFolders(), [subfolder.id]: true })
          })
        }
      }
    } else {
      setSelectedFolders({ ...selectedFolders(), [id]: true })
    }
  })
  return (
    <div class="flex h-full">
      <div class="flex-shrink-0 border-gray border-t py-5 bg-white h-full overflow-auto">
        <A href="/flashcards/all" class="ml-2">
          All flashcards
        </A>
        {data()?.folders.map((folder) => {
          return (
            <FolderComponent
              {...folder}
              preexistingPadding={0}
              selectedFolders={selectedFolders()}
              onSelect={handleSelect()}
            />
          )
        })}
      </div>
      <div class="h-full overflow-auto flex-grow py-5 px-8">
        <Outlet />
      </div>
    </div>
  )
}

const FolderComponent = (
  props: Folder & {
    preexistingPadding: number
    selectedFolders: Record<string, true>
    onSelect: (id: string) => void
  }
) => {
  const params = useParams()
  const [isOpen, setIsOpen] = createSignal(true)
  return (
    <div>
      <div
        class="flex items-center gap-1"
        style={`padding-left: ${props.preexistingPadding + 10}px; background: ${
          props.id === params.folderId ? 'hsla(217, 100%, 96%, 1)' : undefined
        }`}
      >
        {props.subfolders.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsOpen((isOpen) => !isOpen)}
            class={clsx('transition-transform', { 'rotate-90': isOpen() })}
          >
            ⏵
          </button>
        ) : undefined}
        <A
          href={`/flashcards/folder/${props.id}`}
          class="flex gap-2 items-center h-7"
        >
          <div style={{ color: props.color }}>
            <FolderIcon height={13} width={16} />
          </div>
          {props.name}
          <div class="rounded bg-dark-gray w-0.5 h-0.5" />
          <span class="text-dark-gray">{props.flashcardsCount}</span>
        </A>
        <AddButton folderId={props.id} />
        <MoreButton folderId={props.id} />
      </div>
      <div>
        {isOpen()
          ? props.subfolders.map((subfolder) => {
              return (
                <FolderComponent
                  {...subfolder}
                  selectedFolders={props.selectedFolders}
                  onSelect={props.onSelect}
                  preexistingPadding={props.preexistingPadding + 10}
                />
              )
            })
          : undefined}
      </div>
    </div>
  )
}
const AddButton = (props: { folderId: string }) => {
  const [isOpen, setIsOpen] = createSignal(false)
  let ref: HTMLDivElement | undefined
  let handleClick: {
    (event: MouseEvent): void
    (this: Window, ev: MouseEvent): any
    (this: Window, ev: MouseEvent): any
  }
  const close = () => setIsOpen(false)
  onMount(() => {
    handleClick = (event: MouseEvent) => {
      if (ref && !ref.contains(event.target as Node)) {
        close()
      }
    }
    window.addEventListener('click', handleClick)
  })
  onCleanup(() => {
    window.removeEventListener('click', handleClick)
  })
  return (
    <div class="relative" ref={ref}>
      <button
        type="button"
        class="h-4 w-4 bg-blue rounded text-white block"
        onClick={() => setIsOpen((prevVal) => !prevVal)}
      >
        <AddIcon />
      </button>
      {isOpen() && (
        <div class="flex flex-col absolute top-full left-0 rounded-lg px-4 py-2 bg-white shadow z-10 w-max">
          <A
            href={`/flashcards/create?folderId=${props.folderId}`}
            onClick={close}
          >
            Create new flashcard here
          </A>
          <A
            href={`/flashcards/folder/create?folderId=${props.folderId}`}
            onClick={close}
          >
            Create new folder here
          </A>
        </div>
      )}
    </div>
  )
}

const MoreButton = (props: { folderId: string }) => {
  return (
    <div>
      <A
        class="h-4 w-4 bg-blue rounded text-white block"
        href={`/flashcards/folder/edit/${props.folderId}`}
      >
        <MoreIcon />
      </A>
    </div>
  )
}
