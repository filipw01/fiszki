import { FolderIcon } from '~/components/FolderIcon'
import { Tag } from '~/utils.server'
import { clsx } from '~/utils'
import { createMemo, JSX } from 'solid-js'
import { A } from 'solid-start'

interface Props {
  folder?: string
  tags: Tag[]
  size?: 'small' | 'big'
}

const tagBaseClasses =
  'flex items-center py-1 px-4 rounded-3xl uppercase whitespace-nowrap'
const tagStyle = {
  background: 'rgba(var(--color), 0.25)',
  color: 'rgb(var(--color))',
}

export const TagList = (props: Props) => {
  const folderColor = {
    '--color': '25, 130, 196',
    ...tagStyle,
  } as JSX.CSSProperties
  const size = createMemo(() => props.size ?? 'big')
  const tagClasses = createMemo(() =>
    clsx(tagBaseClasses, {
      'text-sm lg:text-lg': size() === 'big',
      'text-xs lg:text-sm': size() === 'small',
    })
  )
  return (
    <div class="flex flex-wrap gap-x-1 gap-y-2 lg:gap-x-2 lg:gap-y-4">
      {props.folder && (
        <div class={tagClasses()} style={folderColor}>
          <FolderIcon class="mr-2" />
          <span class="mt-0.5">{props.folder}</span>
        </div>
      )}
      {props.tags.map(({ color: { r, g, b }, name, id }) => {
        const tagColor = {
          '--color': `${r}, ${g}, ${b}`,
          ...tagStyle,
        } as JSX.CSSProperties
        return (
          <A href={`/tags/${id}`}>
            <div class={tagClasses()} style={tagColor}>
              <span class="mt-0.5">{name}</span>
            </div>
          </A>
        )
      })}
    </div>
  )
}
