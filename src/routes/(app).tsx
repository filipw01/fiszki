import {
  action,
  createAsync,
  RouteSectionProps,
  useSubmission,
} from '@solidjs/router'
import { logout } from '~/server/session.server'
import { createSignal, Show } from 'solid-js'
import {
  SidebarVisibilityProvider,
  useSidebarVisibility,
} from '~/components/SidebarVisibilityContext'
import { requireUserEmail } from '~/server-actions'

const logoutAction = action(logout)

export default function Navigation(props: RouteSectionProps) {
  const email = createAsync(() => requireUserEmail(), { deferStream: true })
  const loggingOut = useSubmission(logoutAction)
  const [sidebarVisible, setSidebarVisible] = createSignal(false)
  return (
    <SidebarVisibilityProvider value={[sidebarVisible, setSidebarVisible]}>
      <Show when={email()} keyed={false}>
        <div class="flex justify-between bg-white px-8 py-5 shadow">
          <div class="flex gap-6">
            <SidebarButton />
            <a href="/">
              <h1>Calendar</h1>
            </a>
            <a href="/flashcards">Flashcards</a>
            <a href="/tags">Tags</a>
          </div>
          <form method="post" action={logoutAction}>
            <button type="submit">
              {loggingOut.pending ? 'Logging out:' : 'Logout:'} {email()!}
            </button>
          </form>
        </div>
      </Show>
      <div class="basis-0 flex-grow overflow-auto">{props.children}</div>
      <div class="spacer" />
    </SidebarVisibilityProvider>
  )
}

const SidebarButton = () => {
  const [isVisible, setVisible] = useSidebarVisibility()
  return (
    <button
      class="md:hidden"
      type="button"
      onClick={() => setVisible((prev) => !prev)}
    >
      {isVisible() ? 'Hide sidebar' : 'Show sidebar'}
    </button>
  )
}
