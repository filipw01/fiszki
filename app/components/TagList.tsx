import { FolderIcon } from '~/components/FolderIcon'
import { styled } from '@stitches/react'

export const TagList = ({
  folder,
  tags,
}: {
  folder: string
  tags: string[]
}) => (
  <StyledTagList>
    <StyledTag>
      <FolderIcon />
      <span>{folder}</span>
    </StyledTag>
    {tags.map((tag) => (
      <StyledTag key={tag}>
        <span>{tag}</span>
      </StyledTag>
    ))}
  </StyledTagList>
)

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
  color: 'rgba(25, 130, 196, 1)',
  background: 'rgba(25, 130, 196, 0.25)',
  borderRadius: 20,
  textTransform: 'uppercase',
  '& span': {
    marginTop: 2,
  },
})
