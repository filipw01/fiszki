import { requireUserEmail } from '~/server/session.server'
import { isNonEmptyString } from '~/utils.server'
import { Input } from '~/components/base/Input'
import {
  useParams,
  redirect,
  action,
  useSubmission,
  createAsync,
  cache,
} from '@solidjs/router'
import { db } from '~/db/db.server'

const routeData = cache(async (id: string) => {
  'use server'
  await requireUserEmail()
  const tag = await db.tag.findUnique({ where: { id: id } })
  if (!tag) {
    throw new Error('Tag not found')
  }

  return { tag }
}, 'tags-edit-id')

const update = action(async (form: FormData) => {
  'use server'

  const email = await requireUserEmail()
  const id = form.get('id')

  if (!isNonEmptyString(id)) {
    return new Error('Missing id')
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
    return new Error('Missing data')
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
})

const deleteAction = action(async (form: FormData) => {
  'use server'

  const email = await requireUserEmail()
  const id = form.get('id')

  if (!isNonEmptyString(id)) {
    return new Error('Missing id')
  }

  await db.tag.findFirstOrThrow({
    where: {
      id,
      owner: { email },
    },
  })
  await db.tag.delete({ where: { id } })
  return redirect('/tags')
})

export default function EditFolder() {
  const params = useParams()
  const id = params.id
  const data = createAsync(() => routeData(id))

  const isUpdating = useSubmission(update)
  const isDeleting = useSubmission(deleteAction)

  return (
    <div class="p-8">
      {isUpdating.pending && <div>Updating...</div>}
      {isUpdating.result && <div>Error: {isUpdating.result.message}</div>}
      <form action={update} method="post">
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
      </form>
      {isDeleting.pending && <div>Deleting...</div>}
      {isDeleting.result && <div>Error: {isDeleting.result.message}</div>}
      <form
        action={deleteAction}
        method="post"
        class="flex flex-col mt-8 gap-2"
      >
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
      </form>
    </div>
  )
}
