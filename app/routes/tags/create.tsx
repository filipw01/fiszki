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
    <Form method="post">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label>
          Name
          <input type="text" name="name" />
        </label>
        <label>
          Color
          <input type="color" name="color" defaultValue="#1982C4" />
        </label>
        <button type="submit">Create</button>
      </div>
    </Form>
  )
}
