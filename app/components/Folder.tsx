import { styled } from '~/styles/stitches.config'
import React from 'react'
import { FolderIcon } from '~/components/FolderIcon'
import { Link } from '@remix-run/react'

export const Folder = ({
  name,
  count,
  color,
  nameLink,
  studyLink,
}: {
  name: string
  count?: number
  color: string
  nameLink: string
  studyLink?: string
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
          <Link
            to={nameLink}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {count !== undefined ? count : null}
            <StudyName>{name}</StudyName>
          </Link>
        </GridItem>
      </GridStacker>
      {studyLink && (
        <Link to={studyLink}>
          <Name>Study</Name>
        </Link>
      )}
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
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})

const Name = styled('div', {
  marginTop: '1rem',
  textAlign: 'center',
})

const StudyName = styled('div', {
  fontSize: 16,
  textAlign: 'center',
  padding: '0 12px',
})
