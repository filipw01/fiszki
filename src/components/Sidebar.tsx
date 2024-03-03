import { JSX } from 'solid-js'
import { clsx } from '~/utils'
import { useSidebarVisibility } from '~/components/SidebarVisibilityContext'

export const Sidebar = (props: { children: JSX.Element }) => {
  const [isSidebarOpen] = useSidebarVisibility()

  return (
    <div
      class={clsx(
        'absolute z-10 left-0 top-0 bottom-0 bg-white p-4 transition overflow-auto flex-shrink-0 shadow-lg',
        'md:bg-transparent md:static md:translate-x-0',
        {
          '-translate-x-full': !isSidebarOpen(),
        }
      )}
    >
      {props.children}
    </div>
  )
}
