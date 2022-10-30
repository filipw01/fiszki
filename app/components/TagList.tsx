import { CSSProperties } from 'react'
import { Link } from '@remix-run/react'
import { FolderIcon } from '~/components/FolderIcon'
import { Tag } from '~/utils.server'
import { clsx } from '~/utils'

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

export const TagList = ({ folder, tags, size = 'big' }: Props) => {
  const folderColor = {
    '--color': '25, 130, 196',
    ...tagStyle,
  } as CSSProperties
  const tagClasses = clsx(tagBaseClasses, {
    'text-sm lg:text-lg': size === 'big',
    'text-xs lg:text-sm': size === 'small',
  })
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-2 lg:gap-x-2 lg:gap-y-4">
      {folder && (
        <Link to={`/study/tag/${folder}`}>
          <div className={tagClasses} style={folderColor}>
            <FolderIcon className="mr-2" />
            <span className="mt-0.5">{folder}</span>
          </div>
        </Link>
      )}
      {tags.map(({ color: { r, g, b }, name, id }) => {
        const tagColor = {
          '--color': `${r}, ${g}, ${b}`,
          ...tagStyle,
        } as CSSProperties
        return (
          <Link key={name} to={`/study/tag/${id}`}>
            <div className={tagClasses} style={tagColor}>
              <span className="mt-0.5">{name}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
