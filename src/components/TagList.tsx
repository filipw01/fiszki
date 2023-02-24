import { Tag as TagType } from '~/utils.server'
import { For, Show } from 'solid-js'
import { A } from 'solid-start'
import { Tag } from './Tag'

interface Props {
  folder?: string
  tags: TagType[]
  size?: 'small' | 'big'
}

export const TagList = (props: Props) => {
  return (
    <div class="flex flex-wrap gap-x-1 gap-y-2 lg:gap-x-2 lg:gap-y-3">
      <Show when={props.folder}>
        <Tag isFolder color={{ r: 25, g: 130, b: 196 }} size={props.size}>
          {props.folder!}
        </Tag>
      </Show>
      <For each={props.tags}>
        {(tag) => (
          <A href={`/tags/${tag.id}`}>
            <Tag color={tag.color} size={props.size}>
              {tag.name}
            </Tag>
          </A>
        )}
      </For>
    </div>
  )
}
