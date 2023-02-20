interface Props {
  value?: string | null
  name: string
  label: string
}

export const Textarea = (props: Props) => {
  return (
    <label>
      <div>{props.label}</div>
      <textarea
        rows={4}
        class="border-dark-gray border rounded-lg resize-none w-full"
        name={props.name}
        value={props.value ?? ''}
      />
    </label>
  )
}
