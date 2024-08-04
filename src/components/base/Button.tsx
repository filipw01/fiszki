import { clsx } from '~/utils'
import { JSX } from 'solid-js'

type Props = {
  position?: 'left' | 'right' | 'standalone'
  size?: 'small'
  color?: 'bad' | 'good' | 'check' | 'skip'
  onClick?: () => void
  children: JSX.Element
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>

export const Button = (props: Props) => {
  const { color, onClick, children, size, position, ...buttonProps } = props
  return (
    <button
      ref={props.ref}
      class={clsx(
        'py-4 px-8 w-full text-white cursor-pointer shadow text-xl hover:outline-none focus-visible:outline-none hover:opacity-80 focus-visible:opacity-80',
        {
          'w-1/5 text-lg py-5 px-1': size === 'small',
          'rounded-b-3xl': position === 'standalone',
          'rounded-bl-3xl': position === 'left',
          'rounded-br-3xl': position === 'right',
        },
      )}
      style={{
        ...(color !== undefined
          ? ({
              '--primary': colors[color],
              'background-color': 'rgb(var(--primary))',
              border: '2px solid rgb(var(--primary))',
              transition: 'all 0.2s',
            } as JSX.CSSProperties)
          : undefined),
      }}
      onClick={onClick}
      {...buttonProps}
    >
      {children}
    </button>
  )
}

const colors: Record<NonNullable<Props['color']>, string> = {
  bad: '218, 80, 5',
  good: '138, 201, 38',
  check: '127, 158, 52',
  skip: '86, 86, 86',
} as const
