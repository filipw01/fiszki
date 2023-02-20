import { requireUserEmail } from '~/session.server'
import { isNonEmptyString } from '~/utils.server'
import { Input } from '~/components/base/Input'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'
import { FormError, useRouteData } from 'solid-start'
import { db } from '~/db/db.server'

export const routeData = () =>
  createServerData$(async (_, { request }) => {
    await requireUserEmail(request)
  })

export default function CreateTag() {
  const data = useRouteData<typeof routeData>()
  data() // trigger the routeData

  const [isCreating, { Form }] = createServerAction$(
    async (form: FormData, { request }) => {
      const email = await requireUserEmail(request)

      const name = form.get('name')
      const color = form.get('color')

      if (!isNonEmptyString(name) || !isNonEmptyString(color)) {
        throw new FormError('Missing data')
      }

      await db.tag.create({
        data: {
          name,
          color,
          owner: { connect: { email } },
        },
      })
      return redirect('/tags')
    }
  )

  return (
    <Form class="p-8">
      {isCreating.pending && <div>Creating...</div>}
      {isCreating.error && <div>{isCreating.error.message}</div>}
      <div class="flex flex-col gap-2">
        <Input name="name" label="Name" />
        <label class="flex">
          Color
          <input
            type="color"
            name="color"
            value="#1982C4"
            class="w-full ml-2"
          />
        </label>
        <button
          type="submit"
          class="px-3 py-2 bg-blue text-white rounded-lg mt-2"
        >
          Create Tag
        </button>
      </div>
    </Form>
  )
}
