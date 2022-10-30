import React, { useId } from 'react'
import { Form } from '@remix-run/react'

interface Props {
  children: React.ReactNode
}

export const AuthForm = ({ children }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Form
        method="post"
        className="bg-white px-12 py-8 shadow radius rounded-xl"
      >
        {children}
      </Form>
    </div>
  )
}

const Field = ({
  type,
  name,
  label,
}: {
  type: string
  name: string
  label: string
}) => {
  const id = useId()
  return (
    <>
      <label className="block" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        className="block my-2 border w-full"
      />
    </>
  )
}

const Submit = ({ children }: { children: string }) => {
  return (
    <button
      type="submit"
      className="block my-4 py-1 px-2 rounded-lg bg-green-600 text-white"
    >
      {children}
    </button>
  )
}

AuthForm.Field = Field
AuthForm.Submit = Submit
