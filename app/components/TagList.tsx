import { CSSProperties } from 'react'
import { FolderIcon } from '~/components/FolderIcon'
import { styled } from '~/styles/stitches.config'
import { Tag } from '~/utils.server'
import { Link } from '@remix-run/react'

export const TagList = ({
  folder,
  tags,
  tagsData,
}: {
  folder: string
  tags: string[]
  tagsData: Tag[]
}) => {
  const folderColor = { '--color': '25, 130, 196' } as CSSProperties
  return (
    <StyledTagList>
      <Link to={`/study/tag/${folder}`}>
        <StyledTag style={folderColor}>
          <FolderIcon />
          <span>{folder}</span>
        </StyledTag>
      </Link>
      {tags.map((tag) => {
        const folderColorData = tagsData.find((tagData) => tagData.name === tag)
          ?.color ?? { r: 0, g: 0, b: 0 }
        const tagColor = {
          '--color': `${folderColorData.r}, ${folderColorData.g}, ${folderColorData.b}`,
        } as CSSProperties
        return (
          <Link key={tag} to={`/study/tag/${tag}`}>
            <StyledTag style={tagColor}>
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
  fontSize: 18,
  background: 'rgba(var(--color), 0.25)',
  color: 'rgb(var(--color))',
  borderRadius: 20,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  '& span': {
    marginTop: 2,
  },

  '@media (max-width: 960px)': {
    fontSize: 14,
  },
})
