import { FolderIcon } from '~/components/FolderIcon'
import { A } from 'solid-start'
import { JSX } from 'solid-js'

export const Folder = ({
  name,
  count,
  color,
  nameLink,
}: {
  name: string
  count?: number
  color: string
  nameLink: string
}) => {
  return (
    <div>
      <div class="grid" style={{ color }}>
        <GridItem>
          <FolderIcon width={122} height={98} class="mr-2" />
        </GridItem>
        <GridItem class="text-white mt-3 mr-2 text-3xl">
          <A
            href={nameLink}
            class="flex flex-col w-full h-full justify-center items-center"
          >
            {count !== undefined ? count : null}
            <div class="text-center px-3 text-base">{name}</div>
          </A>
        </GridItem>
      </div>
    </div>
  )
}

const GridItem = (props: { children: JSX.Element; class?: string }) => {
  return (
    <div
      style="grid-column: 1; grid-row: 1"
      class={`flex flex-col items-center justify-center ${props.class}`}
    >
      {props.children}
    </div>
  )
}
