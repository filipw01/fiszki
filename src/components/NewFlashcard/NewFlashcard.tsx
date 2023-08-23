import { Show } from 'solid-js'
import { Tag } from '~/utils.server'
import { TagList } from '~/components/TagList'
import styles from './NewFlashcard.module.css'

type Props = {
  id: string
  text: string
  image?: string | null
  example?: string | null
  tags?: Tag[]
}

export const NewFlashcard = (props: Props) => {
  return (
    <div class={styles.wrapper}>
      <Show when={props.image}>
        <div class={styles.imageWrapper}>
          <img class={styles.image} src={props.image!} alt="" />
        </div>
      </Show>
      <Show when={props.text || props.example}>
        <div class={styles.mainContent}>
          <Show when={props.text}>
            <p class={styles.title}>{props.text}</p>
          </Show>
          <Show when={props.example}>
            <p class={styles.example}>{props.example}</p>
          </Show>
        </div>
      </Show>
      <Show when={props.tags && props.tags?.length > 0}>
        <div class={styles.tags}>
          <TagList tags={props.tags!} size="small" />
        </div>
      </Show>
    </div>
  )
}
