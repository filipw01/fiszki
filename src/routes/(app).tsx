import { Outlet, useRouteData, A } from 'solid-start'
import { createServerAction$, createServerData$ } from 'solid-start/server'
import { logout, requireUserEmail } from '~/session.server'
import { Show } from 'solid-js'

export const routeData = () =>
  createServerData$(async (_, event) => {
    return await requireUserEmail(event.request)
  })

export default function Navigation() {
  const email = useRouteData<typeof routeData>()
  const [loggingOut, { Form }] = createServerAction$(
    async (_: FormData, { request }) => {
      return logout(request)
    }
  )
  return (
    <>
      <Show when={email()} keyed={false}>
        <div class="flex justify-between bg-white px-8 py-5 shadow">
          <div class="flex gap-6">
            <A href="/">
              <h1>Calendar</h1>
            </A>
            <A href="/flashcards">Flashcards</A>
            <A href="/tags">Tags</A>
          </div>
          <Form>
            <button type="submit">
              {loggingOut.pending ? 'Logging out:' : 'Logout:'} {email()!}
            </button>
          </Form>
        </div>
      </Show>
      <div class="basis-0 flex-grow overflow-auto">
        <Outlet />
      </div>
      <div class="spacer" />
    </>
  )
}
