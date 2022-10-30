import React from 'react'
import { clsx } from '~/utils'

type Props = {
  position?: 'left' | 'right' | 'standalone'
  size?: 'small'
  color?: 'bad' | 'good' | 'check' | 'skip'
  onClick?: () => void
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ color, onClick, children, size, position, ...buttonProps }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'py-4 px-8 w-full text-white cursor-pointer shadow text-xl hover:outline-none focus-visible:outline-none hover:opacity-80 focus-visible:opacity-80',
          {
            'w-1/5 text-lg py-5 px-1': size === 'small',
            'rounded-b-3xl': position === 'standalone',
            'rounded-bl-3xl': position === 'left',
            'rounded-br-3xl': position === 'right',
          }
        )}
        style={{
          ...(color !== undefined
            ? ({
                '--primary': colors[color],
                backgroundColor: 'rgb(var(--primary))',
                border: '2px solid rgb(var(--primary))',
                transition: 'all 0.2s',
              } as React.CSSProperties)
            : undefined),
        }}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }
)

const colors: Record<NonNullable<Props['color']>, string> = {
  bad: '218, 80, 5',
  good: '138, 201, 38',
  check: '127, 158, 52',
  skip: '86, 86, 86',
} as const
