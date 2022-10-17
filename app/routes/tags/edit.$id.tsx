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

export const action: ActionFunction = async ({ request, params }) => {
  const email = await requireUserEmail(request)
  const body = new URLSearchParams(await request.text())
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

    if (!name || !color) {
      return new Response('Missing data', { status: 400 })
    }

    return await db.tag.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        color,
        owner: { connect: { email } },
      },
    })
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
    <div>
      <Form method="post">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>
            Name
            <input type="text" name="name" defaultValue={tag.name} />
          </label>
          <label>
            Color
            <input type="color" name="color" defaultValue={tag.color} />
          </label>
          <button type="submit" name="action" value="update">
            Save
          </button>
        </div>
      </Form>
      <Form method="post">
        <button type="submit" name="action" value="delete">
          Delete
        </button>
      </Form>
    </div>
  )
}
