interface Props {
  letter: string
  onClick: (letter: string) => void
}

export const LetterButton = ({ letter, onClick }: Props) => {
  return (
    <button
      className="block w-full bg-white rounded-md px-2 py-1 m-0 cursor-pointer border border-dark-gray border-solid shadow hover:bg-gray focus-visible:bg-gray"
      type="button"
      onClick={() => onClick(letter)}
    >
      {letter}
    </button>
  )
}
