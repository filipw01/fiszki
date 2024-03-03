import { mount, StartClient } from '@solidjs/start/client'

const root = document.querySelector('#app')
if (!root) {
  throw new Error('No root element')
}
mount(() => <StartClient />, root)
