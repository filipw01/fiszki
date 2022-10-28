import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { LoaderArgs } from '@remix-run/node'
import { db } from '~/utils/db.server'
import { requireUserEmail } from '~/session.server'
import { Prisma } from '@prisma/client'
import { getNestedFlashcardsCount } from '~/routes/flashcards-new/folder.$folderId'
import { useParams } from 'react-router'

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
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flexShrink: 0 }}>
        {folders.map((folder) => {
          return <FolderComponent {...folder} />
        })}
      </div>
      <Outlet />
    </div>
  )
}

const FolderComponent = (props: Folder) => {
  const { folderId } = useParams()
  return (
    <div>
      <Link
        to={`/flashcards-new/folder/${props.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: props.id === folderId ? '#d9f0f1' : undefined,
          padding: 10,
        }}
      >
        <div style={{ background: props.color, height: 10, width: 10 }} />
        {props.name}
        <span style={{ color: 'gray' }}>({props.flashcardsCount})</span>
      </Link>
      <div style={{ paddingLeft: 10 }}>
        {props.subfolders.map((subfolder) => {
          return <FolderComponent {...subfolder} />
        })}
      </div>
    </div>
  )
}
