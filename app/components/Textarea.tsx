import React from 'react'

interface Props {
  defaultValue?: string | null
  name: string
  label: string
}

export const Textarea = ({ defaultValue, name, label }: Props) => {
  return (
    <label>
      <div>{label}</div>
      <textarea
        rows={4}
        className="border-dark-gray border rounded-lg resize-none w-full"
        name={name}
        defaultValue={defaultValue ?? undefined}
      />
    </label>
  )
}
