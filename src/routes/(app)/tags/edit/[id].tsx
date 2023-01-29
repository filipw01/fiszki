import { requireUserEmail } from '~/session.server'
import { isNonEmptyString } from '~/utils.server'
import { Input } from '~/components/Input'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'
import { db } from '~/db/db.server'
import { FormError, RouteDataArgs, useParams, useRouteData } from 'solid-start'

export const routeData = ({ params }: RouteDataArgs) =>
  createServerData$(
    async ([, id], { request }) => {
      await requireUserEmail(request)
      const tag = await db.tag.findUnique({ where: { id } })
      if (!tag) {
        throw new Error('Tag not found')
      }

      return { tag }
    },
    { key: () => ['tag', params.id] }
  )

export default function EditFolder() {
  const data = useRouteData<typeof routeData>()
  const params = useParams()
  const id = params.id

  const [isUpdating, { Form }] = createServerAction$(
    async (form: FormData, { request }) => {
      const email = await requireUserEmail(request)
      const id = form.get('id')

      if (!isNonEmptyString(id)) {
        throw new FormError('Missing id')
      }

      await db.tag.findFirstOrThrow({
        where: {
          id,
          owner: { email },
        },
      })

      const name = form.get('name')
      const color = form.get('color')

      if (!isNonEmptyString(name) || !isNonEmptyString(color)) {
        throw new FormError('Missing data')
      }

      await db.tag.update({
        where: {
          id,
        },
        data: {
          name,
          color,
          owner: { connect: { email } },
        },
      })
      return redirect('/tags')
    }
  )

  const [isDeleting, { Form: DeleteForm }] = createServerAction$(
    async (form: FormData, { request }) => {
      const email = await requireUserEmail(request)
      const id = form.get('id')

      if (!isNonEmptyString(id)) {
        throw new FormError('Missing id')
      }

      await db.tag.findFirstOrThrow({
        where: {
          id,
          owner: { email },
        },
      })
      await db.tag.delete({ where: { id } })
      return redirect('/tags')
    }
  )

  return (
    <div class="p-8">
      {isUpdating.pending && <div>Updating...</div>}
      {isUpdating.error && <div>Error: {isUpdating.error.message}</div>}
      <Form>
        <input type="hidden" name="id" value={id} />
        <div class="flex flex-col gap-2">
          <Input name="name" label="Name" value={data()?.tag.name} />
          <label class="flex">
            Color
            <input
              type="color"
              name="color"
              value={data()?.tag.color}
              class="w-full ml-2"
            />
          </label>
          <button
            type="submit"
            class="px-3 py-2 bg-blue text-white rounded-lg mt-2"
          >
            Save
          </button>
        </div>
      </Form>
      {isDeleting.pending && <div>Deleting...</div>}
      {isDeleting.error && <div>Error: {isDeleting.error.message}</div>}
      <DeleteForm class="flex flex-col mt-8 gap-2">
        <input type="hidden" name="id" value={id} />
        <label>
          <input type="checkbox" required class="mr-2" />I confirm that I want
          to delete this tag
        </label>
        <button
          type="submit"
          class="px-3 py-2 bg-red-500 text-white rounded-lg"
        >
          Delete
        </button>
      </DeleteForm>
    </div>
  )
}
