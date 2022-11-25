import React from 'react'
import { Form, useLoaderData } from '@remix-run/react'
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from '@remix-run/server-runtime'
import { requireUserEmail } from '~/session.server'
import { db } from '~/utils/db.server'
import { isNonEmptyString } from '~/utils.server'
import { Input } from '~/components/Input'

export const action: ActionFunction = async ({ request }) => {
  const email = await requireUserEmail(request)

  const body = await request.formData()

  const name = body.get('name')
  const color = body.get('color')

  if (!isNonEmptyString(name) || !isNonEmptyString(color)) {
    return new Response('Missing data', { status: 400 })
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

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserEmail(request)
  return null
}

export default function CreateTag() {
  return (
    <Form method="post" className="p-8">
      <div className="flex flex-col gap-2">
        <Input name="name" label="Name" />
        <label className="flex">
          Color
          <input
            type="color"
            name="color"
            defaultValue="#1982C4"
            className="w-full ml-2"
          />
        </label>
        <button
          type="submit"
          className="px-3 py-2 bg-blue text-white rounded-lg mt-2"
        >
          Create Tag
        </button>
      </div>
    </Form>
  )
}
