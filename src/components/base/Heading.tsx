type Props = {
  children: string
}

export const Heading = (props: Props) => {
  return <h1 class="text-xl">{props.children}</h1>
}

export const HeadingSmall = (props: Props) => {
  return <h2 class="text-lg">{props.children}</h2>
}
