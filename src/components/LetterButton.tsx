interface Props {
  letter: string
  onClick: (letter: string) => void
}

export const LetterButton = (props: Props) => {
  return (
    <button
      class="block w-full bg-white rounded-md px-2 py-1 m-0 cursor-pointer border border-dark-gray border-solid shadow hover:bg-gray focus-visible:bg-gray"
      type="button"
      onClick={() => props.onClick(props.letter)}
    >
      {props.letter}
    </button>
  )
}
