import { JSX } from 'solid-js'
import { nanoid } from 'nanoid'

interface Props {
  children: JSX.Element
}

export const AuthFormContent = (props: Props) => {
  return (
    <div class="flex flex-col items-center justify-center h-full">
      <div class="bg-white px-12 py-8 shadow radius rounded-xl">
        {props.children}
      </div>
    </div>
  )
}

const Field = (props: { type: string; name: string; label: string }) => {
  const id = nanoid()
  return (
    <>
      <label class="block" for={id}>
        {props.label}
      </label>
      <input
        id={id}
        type={props.type}
        name={props.name}
        class="block my-2 border w-full"
      />
    </>
  )
}

const Submit = (props: { children: string }) => {
  return (
    <button
      type="submit"
      class="block my-4 py-1 px-2 rounded-lg bg-green-600 text-white"
    >
      {props.children}
    </button>
  )
}

AuthFormContent.Field = Field
AuthFormContent.Submit = Submit
