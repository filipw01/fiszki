import { createMemo, Show } from 'solid-js'
import { clsx } from '~/utils'
import { FolderIcon } from '~/components/FolderIcon'

type Props = {
  size?: 'small' | 'big'
  color: {
    r: number
    g: number
    b: number
  }
  children: string
  isFolder?: boolean
}

export const Tag = (props: Props) => {
  const size = createMemo(() => props.size ?? 'big')
  return (
    <div
      class={clsx(
        'flex items-center py-1 px-4 rounded-3xl uppercase whitespace-nowrap',
        {
          'text-sm lg:text-lg': size() === 'big',
          'text-xs lg:text-sm': size() === 'small',
        },
      )}
      style={{
        '--color': `${props.color.r}, ${props.color.g}, ${props.color.b}`,
        background: 'rgba(var(--color), 0.25)',
        color: 'rgb(var(--color))',
      }}
    >
      <Show when={props.isFolder}>
        <FolderIcon class="mr-2" />
      </Show>
      {props.children}
    </div>
  )
}
