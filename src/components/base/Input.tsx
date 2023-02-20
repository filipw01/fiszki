interface Props {
  name: string
  label: string
  value?: string | null
}

export const Input = (props: Props) => {
  return (
    <label class="flex">
      {props.label}
      <input
        class="border-dark-gray border rounded-lg w-full ml-2"
        type="text"
        name={props.name}
        value={props.value ?? ''}
      />
    </label>
  )
}
