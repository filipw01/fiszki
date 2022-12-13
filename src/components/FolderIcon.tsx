interface Props {
  class?: string
  width?: number
  height?: number
}

export const FolderIcon = (props: Props) => (
  <svg
    class={props.class}
    width={props.width ?? 24}
    height={props.height ?? 20}
    viewBox="0 0 24 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.6 0H2.4C1.08 0 0.012 1.125 0.012 2.5L0 17.5C0 18.875 1.08 20 2.4 20H21.6C22.92 20 24 18.875 24 17.5V5C24 3.625 22.92 2.5 21.6 2.5H12L9.6 0Z"
      fill="currentColor"
    />
  </svg>
)
