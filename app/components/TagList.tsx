import { CSSProperties } from 'react'
import { FolderIcon } from '~/components/FolderIcon'
import { styled } from '@stitches/react'
import { Tag } from '~/utils.server'

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
      <StyledTag style={folderColor}>
        <FolderIcon />
        <span>{folder}</span>
      </StyledTag>
      {tags.map((tag) => {
        const folderColorData = tagsData.find((tagData) => tagData.name === tag)
          ?.color ?? { r: 0, g: 0, b: 0 }
        const tagColor = {
          '--color': `${folderColorData.r}, ${folderColorData.g}, ${folderColorData.b}`,
        } as CSSProperties
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
