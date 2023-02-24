import { A } from 'solid-start'
import { Heading } from '~/components/base/Heading'
import AddIcon from '~icons/ri/add-fill?width=24&height=24'

export const HeadingWithCreate = (props: { children: string; url: string }) => {
  return (
    <div class="flex gap-3 items-center">
      <Heading>{props.children}</Heading>
      <A href={props.url} class="h-6 w-6 bg-blue rounded-full text-white block">
        <AddIcon />
      </A>
    </div>
  )
}
