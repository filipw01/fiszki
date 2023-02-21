type Props = {
  children: string
}

export const Heading = (props: Props) => {
  return <h2 class="text-xl">{props.children}</h2>
}

export const HeadingSmall = (props: Props) => {
  return <h3 class="text-lg">{props.children}</h3>
}
