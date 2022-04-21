import { styled } from '~/styles/stitches.config'
import React from 'react'
import { FolderIcon } from '~/components/FolderIcon'

export const Folder = ({
  name,
  count,
  color,
}: {
  name: string
  count: number
  color: string
}) => {
  return (
    <div>
      <GridStacker style={{ color }}>
        <GridItem>
          <FolderIcon width={122} height={98} />
        </GridItem>
        <GridItem
          style={{
            color: '#fff',
            marginTop: '14px',
            marginRight: '6px',
            fontSize: '30px',
          }}
        >
          {count}
        </GridItem>
      </GridStacker>
      <Name>{name}</Name>
    </div>
  )
}

const GridStacker = styled('div', {
  display: 'grid',
})

const GridItem = styled('div', {
  gridColumn: '1',
  gridRow: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const Name = styled('div', {
  marginTop: '1rem',
  textAlign: 'center',
})
