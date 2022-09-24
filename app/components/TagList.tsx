import { CSSProperties } from 'react'
import { FolderIcon } from '~/components/FolderIcon'
import { styled } from '~/styles/stitches.config'
import { Tag } from '~/utils.server'
import { Link } from '@remix-run/react'

export const TagList = ({
  folder,
  tags,
  tagsData,
  size = 'big',
}: {
  folder?: string
  tags: string[]
  tagsData: Tag[]
  size?: 'small' | 'big'
}) => {
  const folderColor = { '--color': '25, 130, 196' } as CSSProperties
  return (
    <StyledTagList>
      {folder && (
        <Link to={`/study/tag/${folder}`}>
          <StyledTag style={folderColor} size={size}>
            <FolderIcon />
            <span>{folder}</span>
          </StyledTag>
        </Link>
      )}
      {tags.map((tag) => {
        const folderColorData = tagsData.find((tagData) => tagData.name === tag)
          ?.color ?? { r: 0, g: 0, b: 0 }
        const tagColor = {
          '--color': `${folderColorData.r}, ${folderColorData.g}, ${folderColorData.b}`,
        } as CSSProperties
        return (
          <Link key={tag} to={`/study/tag/${tag}`}>
            <StyledTag style={tagColor} size={size}>
              <span>{tag}</span>
            </StyledTag>
          </Link>
        )
      })}
    </StyledTagList>
  )
}

const StyledTagList = styled('div', {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 16px',

  '@media (max-width: 960px)': {
    gap: '4px 8px',
  },
})

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
