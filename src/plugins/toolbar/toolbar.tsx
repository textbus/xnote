import { inject, onUnmounted } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { debounceTime, Selection, tap } from '@textbus/core'
import { SelectionBridge, VIEW_DOCUMENT } from '@textbus/platform-browser'

import css from './toolbar.scoped.scss'
import { useProduce } from '@viewfly/hooks'

export function Toolbar() {
  const selection = inject(Selection)
  const viewDocument = inject(VIEW_DOCUMENT)
  const bridge = inject(SelectionBridge)

  const [viewPosition, updateViewPosition] = useProduce({
    left: 0,
    top: 0,
    isHide: true,
    opacity: 0,
    transitionDuration: 0
  })

  const subscription = selection.onChange.pipe(
    tap(() => {
      if (selection.isCollapsed) {
        updateViewPosition(draft => {
          draft.opacity = 0
          draft.isHide = true
          draft.transitionDuration = 0
        })
      }
    }),
    debounceTime(300)
  ).subscribe(() => {
    if (selection.isCollapsed) {
      return
    }

    const containerRect = viewDocument.getBoundingClientRect()
    const selectionFocusRect = bridge.getRect({
      slot: selection.focusSlot!,
      offset: selection.focusOffset!
    })!
    const selectionAnchorRect = bridge.getRect({
      slot: selection.anchorSlot!,
      offset: selection.anchorOffset!
    })!

    const centerLeft = (selectionFocusRect.left + selectionAnchorRect.left) / 2

    updateViewPosition(draft => {
      draft.isHide = false
      draft.transitionDuration = .15
      draft.left = centerLeft - containerRect.left
      draft.top = selectionFocusRect.top - containerRect.top + 10
    })

    setTimeout(() => {
      updateViewPosition(draft => {
        draft.opacity = 1
        draft.top = selectionFocusRect.top - containerRect.top
      })
    }, 200)
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })
  return withScopedCSS(css, () => {
    const p = viewPosition()
    return (
      <div class="editor-toolbar" style={{
        left: p.left + 'px',
        top: p.top + 36 + 'px',
        pointerEvents: p.isHide ? 'none' : 'initial',
        opacity: p.opacity,
        transitionDuration: p.transitionDuration + 's'
      }}>
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
    )
  })
}
