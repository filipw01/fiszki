import {
  Flashcard as FlashcardType,
  getFolderPath,
  mapFlashcard,
} from '~/utils.server'
import { Flashcard } from '~/components/Flashcard'
import { requireUserEmail } from '~/session.server'
import { Prisma } from '@prisma/client'
import { Folder } from '~/components/Folder'
import { FoldersContainer } from '~/routes/(app)/tags'
import { A, RouteDataArgs, useParams, useRouteData } from 'solid-start'
import { createServerData$ } from 'solid-start/server'
import { db } from '~/db/db.server'
import { createSignal, Show } from 'solid-js'

export const routeData = ({ params }: RouteDataArgs) =>
  createServerData$(
    async ([, folderId], { request }) => {
      const email = await requireUserEmail(request)

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
        folderName: getFolderPath(folder.id, folders),
        parentFolder: folder.parentFolderId,
        subfolders: await Promise.all(
          folder.folders.map(async (folder) => ({
            ...folder,
            flashcardsCount: await getNestedFlashcardsCount(folder, email),
          }))
        ),
      }
    },
    { key: () => ['folder', params.folderId] }
  )

export async function getNestedFlashcardsCount(
  folder: Prisma.FolderGetPayload<{}>,
  email: string
): Promise<number> {
  const folders = await db.folder.findMany({
    where: {
      id: folder.id,
      owner: { email },
    },
    include: {
      _count: {
        select: {
          flashcards: true,
        },
      },

      folders: true,
    },
  })
  let sum = 0
  for (const folder of folders) {
    sum += folder._count.flashcards
    for (const subfolder of folder.folders) {
      sum += await getNestedFlashcardsCount(subfolder, email)
    }
  }

  return sum
}

export default function Subfolder() {
  const data = useRouteData<typeof routeData>()
  const params = useParams()

  return (
    <div>
      <h1>Folder {data()?.folderName}</h1>
      {data()?.parentFolder && (
        <A href={`/flashcards/folder/${data()?.parentFolder}`}>Up</A>
      )}
      <div class="flex gap-4">
        <A
          class="block w-32 h-32 p-4 rounded-2xl bg-white shadow-sm"
          href={`/flashcards/create?folderId=${params.folderId}`}
        >
          Create new flashcard here
        </A>
        <A
          class="block w-32 h-32 p-4 rounded-2xl bg-white shadow-sm"
          href={`/flashcards/folder/create?folderId=${params.folderId}`}
        >
          Create new folder here
        </A>
      </div>

      <FoldersContainer>
        {data()?.subfolders.map(({ id, color, flashcardsCount, name }) => (
          <Folder
            nameLink={`/flashcards/folder/${id}`}
            name={name}
            count={flashcardsCount}
            color={color}
          />
        ))}
      </FoldersContainer>
      <div
        class="grid gap-4"
        style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))"
      >
        {data()?.flashcards.map((flashcard) => {
          return <TurnableFlashcard flashcard={flashcard} />
        })}
      </div>
    </div>
  )
}

const TurnableFlashcard = (props: { flashcard: FlashcardType }) => {
  const [isFront, setIsFront] = createSignal(true)
  const turn = () => setIsFront((prev) => !prev)
  return (
    <Show
      when={isFront()}
      fallback={
        <Flashcard
          onClick={turn}
          text={props.flashcard.back}
          image={props.flashcard.backImage}
          example={props.flashcard.backDescription}
          tags={props.flashcard.tags}
          id={props.flashcard.id}
        />
      }
    >
      <Flashcard
        onClick={turn}
        text={props.flashcard.front}
        example={props.flashcard.frontDescription}
        image={props.flashcard.frontImage}
        tags={props.flashcard.tags}
        id={props.flashcard.id}
        isEditable
      />
    </Show>
  )
}
