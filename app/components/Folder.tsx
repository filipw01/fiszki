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
      <div className="grid" style={{ color }}>
        <GridItem>
          <FolderIcon width={122} height={98} className="mr-2" />
        </GridItem>
        <GridItem className="text-white mt-3 mr-2 text-3xl">
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
            <div className="text-center px-3 text-base">{name}</div>
          </Link>
        </GridItem>
      </div>
      {studyLink && (
        <Link to={studyLink}>
          <div className="mt-4 text-center">Study</div>
        </Link>
      )}
    </div>
  )
}

const GridItem = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      style={{ gridColumn: 1, gridRow: 1 }}
      className={`flex flex-col items-center justify-center ${className}`}
    >
      {children}
    </div>
  )
}
