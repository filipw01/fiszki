import { JSX } from 'solid-js'
import styles from './FoldersGrid.module.css'

export const FoldersGrid = (props: { children: JSX.Element }) => {
  return <div class={styles.wrapper}>{props.children}</div>
}
