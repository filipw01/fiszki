import { getFolderPath, mapFlashcard } from '~/utils.server'
import { requireUserEmail } from '~/server/session.server'
import { Folder } from '~/components/Folder/Folder'
import { Show } from 'solid-js'
import { cache, createAsync, useParams } from '@solidjs/router'
import HomeIcon from '~icons/ri/home-4-line'
import { HeadingWithCreate } from '~/components/HeadingWithCreate'
import { TurnableFlashcard } from '~/components/TurnableFlashcard/TurnableFlashcard'
import { FoldersGrid } from '~/components/FoldersGrid/FoldersGrid'
import { db } from '~/db/db.server'
import { getNestedFlashcardsCount } from '~/server/getNestedFlashcardsCount'

const flashcardsFolderId = cache(async (folderId: string) => {
  'use server'

  const email = await requireUserEmail()
  const folder = await db.folder.findFirst({
    where: {
      id: folderId,
      owner: { email },
    },
    include: {
      flashcards: {
        include: {
          folder: true,
          tags: true,
        },
      },
      folders: true,
    },
  })
  const folders = await db.folder.findMany({ where: { owner: { email } } })
  if (!folder) {
    throw new Error('Not found')
  }

  return {
    flashcards: folder.flashcards.map((tag) => mapFlashcard(tag, folders)),
    folderPath: getFolderPath(folder.id, folders),
    subfolders: await Promise.all(
      folder.folders.map(async (folder) => ({
        ...folder,
        flashcardsCount: await getNestedFlashcardsCount(folder, email),
      }))
    ),
  }
}, 'folder-folderId')

export default function Subfolder() {
  const params = useParams()
  const data = createAsync(() => flashcardsFolderId(params.folderId))

  return (
    <div>
      <div class="flex gap-2 items-center mb-4">
        <HomeIcon class="w-6 h-6" />/
        {data()?.folderPath.map((folder, index) => (
          <>
            <Show when={index > 0}>{'/'}</Show>
            <a href={`/flashcards/folder/${folder.id}`}>{folder.name}</a>
          </>
        ))}
      </div>
      <HeadingWithCreate
        url={`/flashcards/folder/create?folderId=${params.folderId}`}
      >
        Folders
      </HeadingWithCreate>
      <Show
        when={data()?.subfolders.length ?? 0 > 0}
        fallback={
          <div class="flex bg-white shadow-sm rounded-lg h-8 w-full justify-center items-center mt-2 mb-4">
            No folders here
          </div>
        }
      >
        <FoldersGrid>
          {data()?.subfolders.map(({ id, color, flashcardsCount, name }) => (
            <Folder
              nameLink={`/flashcards/folder/${id}`}
              name={name}
              count={flashcardsCount}
              color={color}
            />
          ))}
        </FoldersGrid>
      </Show>
      <HeadingWithCreate url={`/flashcards/create?folderId=${params.folderId}`}>
        Flashcards
      </HeadingWithCreate>
      <Show
        when={data()?.flashcards.length ?? 0 > 0}
        fallback={
          <div class="flex bg-white shadow-sm rounded-lg h-8 w-full justify-center items-center mt-2 mb-4">
            No flashcards here
          </div>
        }
      >
        <div
          class="grid gap-4 mt-4 mb-6"
          style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); align-items: start"
        >
          {data()?.flashcards.map((flashcard) => {
            return <TurnableFlashcard flashcard={flashcard} />
          })}
        </div>
      </Show>
    </div>
  )
}
