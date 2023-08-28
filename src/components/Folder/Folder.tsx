import { FolderIcon } from '~/components/FolderIcon'
import { A } from 'solid-start'
import styles from './Folder.module.css'

type Props = {
  name: string
  count?: number
  color: string
  nameLink: string
}

export const Folder = (props: Props) => {
  return (
    <A href={props.nameLink} class={styles.card}>
      <div class={styles.icon} style={{ '--icon-color': props.color }}>
        <FolderIcon width={42} height={34} />
      </div>
      <div class={styles.textWrapper}>
        <p class={styles.name}>{props.name}</p>
        <p class={styles.counter}>
          {(props.count !== undefined ? props.count : 0) + ' flashcards'}
        </p>
      </div>
    </A>
  )
}
