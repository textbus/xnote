import { inject, onUnmounted } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { Selection } from '@textbus/core'

import css from './toolbar.scoped.scss'

export function Toolbar() {
  const selection = inject(Selection)
  const subscription = selection.onChange.subscribe(() => {
    console.log(4)
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })
  return withScopedCSS(css, () => (
    <div class="editor-toolbar">
      <div class="editor-toolbar-item">
        <button class="editor-toolbar-btn" type="button">h1</button>
      </div>
      <div class="editor-toolbar-item">
        <button class="editor-toolbar-btn" type="button">h2</button>
      </div>
      <div class="editor-toolbar-item">
        <button class="editor-toolbar-btn" type="button">h3</button>
      </div>
      <div class="editor-toolbar-item">
        <button class="editor-toolbar-btn" type="button">h4</button>
      </div>
    </div>
  ))
}
