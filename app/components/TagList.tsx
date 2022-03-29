import { CSSProperties } from 'react'
import { FolderIcon } from '~/components/FolderIcon'
import { styled } from '@stitches/react'

export const TagList = ({
  folder,
  tags,
}: {
  folder: string
  tags: string[]
}) => {
  const folderColor = { '--color': '25, 130, 196' } as CSSProperties
  return (
    <StyledTagList>
      <StyledTag style={folderColor}>
        <FolderIcon />
        <span>{folder}</span>
      </StyledTag>
      {tags.map((tag) => {
        const tagColor = { '--color': '125, 30, 190' } as CSSProperties
        return (
          <StyledTag key={tag} style={tagColor}>
            <span>{tag}</span>
          </StyledTag>
        )
      })}
    </StyledTagList>
  )
}

const StyledTagList = styled('div', {
  display: 'flex',
  gap: 16,
  marginBottom: 20,
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
  '& span': {
    marginTop: 2,
  },
})
