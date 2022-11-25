import React from 'react'
import { Form, useLoaderData } from '@remix-run/react'
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from '@remix-run/server-runtime'
import { db } from '~/utils/db.server'
import { Prisma } from '@prisma/client'
import { requireUserEmail } from '~/session.server'
import { isNonEmptyString } from '~/utils.server'
import { Input } from '~/components/Input'

export const action: ActionFunction = async ({ request, params }) => {
  const email = await requireUserEmail(request)
  const body = await request.formData()
  const action = body.get('action')

  await db.tag.findFirstOrThrow({
    where: {
      id: params.id,
      owner: { email },
    },
  })

  if (action === 'update') {
    const name = body.get('name')
    const color = body.get('color')

    if (!isNonEmptyString(name) || !isNonEmptyString(color)) {
      return new Response('Missing data', { status: 400 })
    }

    await db.tag.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        color,
        owner: { connect: { email } },
      },
    })
    return redirect('/tags')
  } else if (action === 'delete') {
    await db.tag.delete({ where: { id: params.id } })
    return redirect('/tags')
  }
}

export const loader: LoaderFunction = async ({ params, request }) => {
  await requireUserEmail(request)
  const tag = await db.tag.findUnique({ where: { id: params.id } })
  if (!tag) {
    return new Response('Not found', { status: 404 })
  }

  return json<{
    tag: Prisma.TagGetPayload<{}>
  }>({ tag })
}

export default function EditFolder() {
  const { tag } = useLoaderData<{
    tag: Prisma.TagGetPayload<{}>
  }>()

  return (
    <div className="p-8">
      <Form method="post">
        <div className="flex flex-col gap-2">
          <Input name="name" label="Name" defaultValue={tag.name} />
          <label className="flex">
            Color
            <input
              type="color"
              name="color"
              defaultValue={tag.color}
              className="w-full ml-2"
            />
          </label>
          <button
            type="submit"
            name="action"
            value="update"
            className="px-3 py-2 bg-blue text-white rounded-lg mt-2"
          >
            Save
          </button>
        </div>
      </Form>
      <Form method="post" className="flex flex-col mt-8 gap-2">
        <label>
          <input type="checkbox" required className="mr-2" />I confirm that I
          want to delete this tag
        </label>
        <button
          type="submit"
          name="action"
          value="delete"
          className="px-3 py-2 bg-red-500 text-white rounded-lg"
        >
          Delete
        </button>
      </Form>
    </div>
  )
}
