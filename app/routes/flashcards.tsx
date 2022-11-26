import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { LoaderArgs } from '@remix-run/node'
import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'
import { Prisma } from '@prisma/client'
import { getNestedFlashcardsCount } from './flashcards/folder.$folderId'
import { useParams } from 'react-router'
import { FolderIcon } from '~/components/FolderIcon'
import React, { useEffect, useState } from 'react'
import { AddIcon } from '~/components/AddIcon'
import { MoreIcon } from '~/components/MoreIcon'

type Folder = Prisma.FolderGetPayload<{}> & {
  flashcardsCount: number
  subfolders: Array<Folder>
}

export const loader = async ({ request }: LoaderArgs) => {
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
        throw new Response(
          `Invalid folder structure, got ${JSON.stringify(
            folder
          )}, but folder with ${folder.parentFolderId} does not exist`,
          { status: 500 }
        )
      }
    }
  }

  return { folders }
}

export default function Flashcards() {
  const { folders } = useLoaderData<typeof loader>()
  return (
    <div className="flex h-full">
      <div className="flex-shrink-0 border-gray border-t py-5 bg-white">
        <Link to="/flashcards/all" className="ml-2">
          All flashcards
        </Link>
        {folders.map((folder) => {
          return <FolderComponent {...folder} preexistingPadding={0} />
        })}
      </div>
      <div className="h-full overflow-auto flex-grow py-5 px-8">
        <Outlet />
      </div>
    </div>
  )
}

const FolderComponent = (props: Folder & { preexistingPadding: number }) => {
  const { folderId } = useParams()
  return (
    <div>
      <div
        className="flex items-center gap-1"
        style={{
          paddingLeft: props.preexistingPadding + 10,
          background:
            props.id === folderId ? 'hsla(217, 100%, 96%, 1)' : undefined,
        }}
      >
        <Link
          to={`/flashcards/folder/${props.id}`}
          className="flex gap-2 items-center h-7"
        >
          <div style={{ color: props.color }}>
            <FolderIcon height={13} width={16} />
          </div>
          {props.name}
          <div className="rounded bg-dark-gray w-0.5 h-0.5" />
          <span className="text-dark-gray">{props.flashcardsCount}</span>
        </Link>
        <AddButton folderId={props.id} />
        <MoreButton folderId={props.id} />
      </div>
      <div>
        {props.subfolders.map((subfolder) => {
          return (
            <FolderComponent
              {...subfolder}
              preexistingPadding={props.preexistingPadding + 10}
            />
          )
        })}
      </div>
    </div>
  )
}
const AddButton = ({ folderId }: { folderId: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const close = () => setIsOpen(false)
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close()
      }
    }
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('click', handleClick)
    }
  }, [close])
  return (
    <div className="relative" ref={ref}>
      <button
        className="h-4 w-4 bg-blue rounded text-white block"
        onClick={() => setIsOpen((prevVal) => !prevVal)}
      >
        <AddIcon />
      </button>
      {isOpen && (
        <div className="flex flex-col absolute top-full left-0 rounded-lg px-4 py-2 bg-white shadow z-10 w-max">
          <Link to={`/flashcards/create?folderId=${folderId}`} onClick={close}>
            Create new flashcard here
          </Link>
          <Link to={`/flashcards/folders/create?folderId=${folderId}`} onClick={close}>
            Create new folder here
          </Link>
        </div>
      )}
    </div>
  )
}

const MoreButton = ({ folderId }: { folderId: string }) => {
  return (
    <div>
      <Link
        className="h-4 w-4 bg-blue rounded text-white block"
        to={`/flashcards/folders/edit/${folderId}`}
      >
        <MoreIcon />
      </Link>
    </div>
  )
}
