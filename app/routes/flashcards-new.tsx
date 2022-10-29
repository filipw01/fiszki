import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { LoaderArgs } from '@remix-run/node'
import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'
import { Prisma } from '@prisma/client'
import { getNestedFlashcardsCount } from '~/routes/flashcards-new/folder.$folderId'
import { useParams } from 'react-router'
import { FolderIcon } from '~/components/FolderIcon'

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

export default function FlashcardsNew() {
  const { folders } = useLoaderData<typeof loader>()
  return (
    <div className="flex h-full">
      <div className="flex-shrink-0 border-gray border-t py-5 bg-white">
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
      <Link
        to={`/flashcards-new/folder/${props.id}`}
        className="pr-2 flex gap-2 items-center h-7"
        style={{
          paddingLeft: props.preexistingPadding + 10,
          background:
            props.id === folderId ? 'hsla(217, 100%, 96%, 1)' : undefined,
        }}
      >
        <div style={{ color: props.color }}>
          <FolderIcon height={13} width={16} />
        </div>
        {props.name}
        <div className="rounded bg-dark-gray w-0.5 h-0.5" />
        <span className="text-dark-gray">{props.flashcardsCount}</span>
      </Link>
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
