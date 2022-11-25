import React from 'react'

interface Props {
  name: string
  label: string
  defaultValue?: string | null
}

export const Input = ({ name, defaultValue, label }: Props) => {
  return (
    <label className="flex">
      {label}
      <input
        className="border-dark-gray border rounded-lg w-full ml-2"
        type="text"
        name={name}
        defaultValue={defaultValue ?? undefined}
      />
    </label>
  )
}
