import { requireUserEmail } from '~/server/session.server'
import { isNonEmptyString } from '~/utils.server'
import { Input } from '~/components/base/Input'
import {
  action,
  cache,
  createAsync,
  redirect,
  useSubmission,
} from '@solidjs/router'
import { db } from '~/db/db.server'

const routeData = cache(async () => {
  'use server'

  await requireUserEmail()
}, 'tags-create')

const createTag = action(async (form: FormData) => {
  'use server'

  const email = await requireUserEmail()

  const name = form.get('name')
  const color = form.get('color')

  if (!isNonEmptyString(name) || !isNonEmptyString(color)) {
    throw new Error('Missing data')
  }

  await db.tag.create({
    data: {
      name,
      color,
      owner: { connect: { email } },
    },
  })
  return redirect('/tags')
})

export default function CreateTag() {
  const data = createAsync(() => routeData())
  data() // trigger the routeData

  const isCreating = useSubmission(createTag)

  return (
    <form class="p-8" method="post" action={createTag}>
      {isCreating.pending && <div>Creating...</div>}
      {/*{isCreating.error && <div>{isCreating.error.message}</div>}*/}
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
    </form>
  )
}
