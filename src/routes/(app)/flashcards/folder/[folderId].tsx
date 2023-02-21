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
import { Heading } from '~/components/base/Heading'
import AddIcon from '~icons/ri/add-fill?width=24&height=24'
import HomeIcon from '~icons/ri/home-4-line?width=24&height=24'

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
        folderPath: getFolderPath(folder.id, folders),
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
      <div class="flex gap-2 items-center mb-4">
        <HomeIcon />/
        {data()?.folderPath.map((folder, index) => (
          <>
            <Show when={index > 0}>{'/'}</Show>
            <A href={`/flashcards/folder/${folder.id}`}>{folder.name}</A>
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
        <FoldersContainer class="mt-4 mb-6">
          {data()?.subfolders.map(({ id, color, flashcardsCount, name }) => (
            <Folder
              nameLink={`/flashcards/folder/${id}`}
              name={name}
              count={flashcardsCount}
              color={color}
            />
          ))}
        </FoldersContainer>
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
          style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))"
        >
          {data()?.flashcards.map((flashcard) => {
            return <TurnableFlashcard flashcard={flashcard} />
          })}
        </div>
      </Show>
    </div>
  )
}

const HeadingWithCreate = (props: { children: string; url: string }) => {
  return (
    <div class="flex gap-3 items-center">
      <Heading>{props.children}</Heading>
      <A href={props.url} class="h-6 w-6 bg-blue rounded-full text-white block">
        <AddIcon />
      </A>
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
