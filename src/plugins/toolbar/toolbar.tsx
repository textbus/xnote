import { inject, onUnmounted } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { delay, filter, fromEvent, map, Selection, Subscription } from '@textbus/core'
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

  let mouseupSubscription = new Subscription()

  function bindMouseup() {
    mouseupSubscription = fromEvent(viewDocument, 'mouseup').pipe(
      delay(100),
      filter(() => {
        return !selection.isCollapsed
      }),
      map(() => {
        const containerRect = viewDocument.getBoundingClientRect()
        const selectionFocusRect = bridge.getRect({
          slot: selection.focusSlot!,
          offset: selection.focusOffset!
        })!

        const centerLeft = selectionFocusRect.left // (selectionFocusRect.left + selectionAnchorRect.left) / 2
        const focusEnd = selection.focusSlot === selection.endSlot && selection.focusOffset === selection.endOffset
        const top = focusEnd ? selectionFocusRect.top - containerRect.top : selectionFocusRect.top - containerRect.top - 80

        updateViewPosition(draft => {
          draft.isHide = false
          draft.transitionDuration = .15
          draft.left = centerLeft - containerRect.left
          draft.top = top + 10
        })
        return top
      }),
      delay(200)
    ).subscribe((top) => {
      updateViewPosition(draft => {
        draft.opacity = 1
        draft.top = top
      })
    })
  }


  const mousedownSubscription = fromEvent(document, 'mousedown').subscribe(() => {
    mouseupSubscription.unsubscribe()
    updateViewPosition(draft => {
      draft.opacity = 0
      draft.isHide = true
      draft.transitionDuration = 0
    })
    bindMouseup()
  })
  onUnmounted(() => {
    mousedownSubscription.unsubscribe()
    mouseupSubscription.unsubscribe()
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
