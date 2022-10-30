import { CSSProperties } from 'react'
import { FolderIcon } from '~/components/FolderIcon'
import { styled } from '~/styles/stitches.config'
import { Tag } from '~/utils.server'
import { Link } from '@remix-run/react'

export const TagList = ({
  folder,
  tags,
  size = 'big',
}: {
  folder?: string
  tags: Tag[]
  size?: 'small' | 'big'
}) => {
  const folderColor = { '--color': '25, 130, 196' } as CSSProperties
  return (
    <div className='flex flex-wrap gap-x-1 gap-y-2 lg:gap-x-2 lg:gap-y-4'>
      {folder && (
        <Link to={`/study/tag/${folder}`}>
          <StyledTag style={folderColor} size={size}>
            <FolderIcon className='mr-2'/>
            <span>{folder}</span>
          </StyledTag>
        </Link>
      )}
      {tags.map(({ color: { r, g, b }, name, id }) => {
        const tagColor = { '--color': `${r}, ${g}, ${b}` } as CSSProperties
        return (
          <Link key={name} to={`/study/tag/${id}`}>
            <StyledTag style={tagColor} size={size}>
              <span>{name}</span>
            </StyledTag>
          </Link>
        )
      })}
    </div>
  )
}

const StyledTag = styled('div', {
  display: 'flex',
  alignItems: 'center',
  padding: '5px 16px 5px',
  background: 'rgba(var(--color), 0.25)',
  color: 'rgb(var(--color))',
  borderRadius: 20,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  '& span': {
    marginTop: 2,
  },

  variants: {
    size: {
      small: {
        fontSize: 14,
        '@media (max-width: 960px)': {
          fontSize: 12,
        },
      },
      big: {
        fontSize: 18,
        '@media (max-width: 960px)': {
          fontSize: 14,
        },
      },
    },
  },
})
