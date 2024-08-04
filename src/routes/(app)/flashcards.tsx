import { requireUserEmail } from '~/server/session.server'
import { Prisma } from '@prisma/client'
import { FolderIcon } from '~/components/FolderIcon'
import { clsx } from '~/utils'
import { db } from '~/db/db.server'
import {
  cache,
  createAsync,
  RouteSectionProps,
  useParams,
} from '@solidjs/router'
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { getNestedFlashcardsCount } from '~/server/getNestedFlashcardsCount'
import { Sidebar } from '~/components/Sidebar'
import AddIcon from '~icons/ri/add-fill'
import MoreIcon from '~icons/ri/more-fill'
import ArrowIcon from '~icons/ri/arrow-right-s-line'
import { isServer } from 'solid-js/web'

type Folder = Prisma.FolderGetPayload<{}> & {
  flashcardsCount: number
  subfolders: Array<Folder>
}

const routeData = cache(async () => {
  'use server'
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

  return { folders }
}, 'flashcards')

export default function Flashcards(props: RouteSectionProps) {
  const [selectedFolders, setSelectedFolders] = createSignal<
    Record<string, true>
  >({})

  const data = createAsync(() => routeData())

  const handleSelect = (id: string) => {
    const subfolders =
      data()?.folders.find((folder) => folder.id === id)?.subfolders ?? []
    if (selectedFolders()[id]) {
      if (subfolders.every((subfolder) => selectedFolders()[subfolder.id])) {
        const newSelectedFolders = { ...selectedFolders() }
        delete newSelectedFolders[id]
        setSelectedFolders(newSelectedFolders)
      } else {
        const allSubfolders: Record<string, true> = Object.fromEntries(
          subfolders.map((subfolder) => [subfolder.id, true]),
        )
        setSelectedFolders({ ...selectedFolders(), ...allSubfolders })
      }
    } else {
      setSelectedFolders({ ...selectedFolders(), [id]: true })
    }
  }

  return (
    <div class="flex h-full relative">
      <Sidebar>
        <div class="-mx-4">
          <a href="/flashcards/all" class="ml-4">
            All flashcards
          </a>
          <For each={data()?.folders}>
            {(folder) => (
              <FolderComponent
                {...folder}
                preexistingPadding={12}
                selectedFolders={selectedFolders()}
                onSelect={handleSelect}
              />
            )}
          </For>
        </div>
      </Sidebar>
      <div class="h-full overflow-auto flex-grow py-5 px-8">
        {props.children}
      </div>
    </div>
  )
}

const FolderComponent = (
  props: Folder & {
    preexistingPadding: number
    selectedFolders: Record<string, true>
    onSelect: (id: string) => void
  },
) => {
  const params = useParams()
  const [isOpen, setIsOpen] = createSignal(true)
  return (
    <div>
      <div
        class="flex items-center gap-1 pr-2"
        style={`padding-left: ${
          props.subfolders.length > 0
            ? props.preexistingPadding
            : props.preexistingPadding + 16
        }px; background: ${
          props.id === params.folderId ? 'hsla(217, 100%, 96%, 1)' : undefined
        }`}
      >
        <Show when={props.subfolders.length > 0}>
          <button
            type="button"
            onClick={() => setIsOpen((isOpen) => !isOpen)}
            class={clsx('transition-transform', { 'rotate-90': isOpen() })}
          >
            <ArrowIcon class="w-3 h-3" />
          </button>
        </Show>
        <a
          href={`/flashcards/folder/${props.id}`}
          class="flex gap-2 items-center h-7"
        >
          <div style={{ color: props.color }}>
            <FolderIcon height={13} width={16} />
          </div>
          {props.name}
          <div class="rounded bg-dark-gray w-0.5 h-0.5" />
          <span class="text-dark-gray">{props.flashcardsCount}</span>
        </a>
        <AddButton folderId={props.id} />
        <MoreButton folderId={props.id} />
      </div>
      <div>
        <Show when={isOpen()}>
          <For each={props.subfolders}>
            {(subfolder) => (
              <FolderComponent
                {...subfolder}
                selectedFolders={props.selectedFolders}
                onSelect={props.onSelect}
                preexistingPadding={props.preexistingPadding + 16}
              />
            )}
          </For>
        </Show>
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
    if (!isServer) {
      window.removeEventListener('click', handleClick)
    }
  })
  return (
    <div class="relative" ref={ref}>
      <button
        type="button"
        class="h-4 w-4 bg-blue rounded text-white block"
        onClick={() => setIsOpen((prevVal) => !prevVal)}
      >
        <AddIcon class="w-4 h-4" />
      </button>
      <Show when={isOpen()}>
        <div class="flex flex-col absolute top-full left-0 rounded-lg px-4 py-2 bg-white shadow z-10 w-max">
          <a
            href={`/flashcards/create?folderId=${props.folderId}`}
            onClick={close}
          >
            Create new flashcard here
          </a>
          <a
            href={`/flashcards/folder/create?folderId=${props.folderId}`}
            onClick={close}
          >
            Create new folder here
          </a>
        </div>
      </Show>
    </div>
  )
}

const MoreButton = (props: { folderId: string }) => {
  return (
    <div>
      <a
        class="h-4 w-4 bg-blue rounded text-white block"
        href={`/flashcards/folder/edit/${props.folderId}`}
      >
        <MoreIcon class="w-4 h-4" />
      </a>
    </div>
  )
}
