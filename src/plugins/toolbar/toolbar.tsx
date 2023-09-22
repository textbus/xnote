import { inject, InjectFlags, onUnmounted, provide } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { debounceTime, delay, filter, fromEvent, map, merge, Selection, Subscription, Textbus } from '@textbus/core'
import { SelectionBridge, VIEW_DOCUMENT } from '@textbus/platform-browser'
import { useProduce, useStaticRef } from '@viewfly/hooks'

import css from './toolbar.scoped.scss'
import { Bold } from '../_common/bold'
import { Italic } from '../_common/italic'
import { StrikeThrough } from '../_common/strike-through'
import { Underline } from '../_common/underline'
import { RefreshService } from '../../services/refresh.service'
import { BlockTool } from './block-tool'

export function Toolbar() {
  provide(RefreshService)
  const selection = inject(Selection)
  const viewDocument = inject(VIEW_DOCUMENT)
  const bridge = inject(SelectionBridge)
  const textbus = inject(Textbus)
  const refreshService = inject(RefreshService, null, InjectFlags.Default)!

  const subscription = merge(textbus.onChange).pipe(
    debounceTime(20)
  ).subscribe(() => {
    refreshService.onRefresh.next()
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const [viewPosition, updateViewPosition] = useProduce({
    left: 0,
    top: 0,
    isHide: true,
    opacity: 0,
    transitionDuration: 0
  })

  let mouseupSubscription = new Subscription()
  const containerRef = useStaticRef<HTMLElement>()

  function getTop() {
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
  }

  const sub = textbus.onChange.pipe(debounceTime(100)).subscribe(() => {
    if (!viewPosition().isHide) {
      const top = getTop()
      updateViewPosition(draft => {
        draft.top = top
      })
    }
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  function bindMouseup() {
    mouseupSubscription = fromEvent<MouseEvent>(viewDocument, 'mouseup').pipe(
      filter(ev => {
        return !ev.composedPath().includes(containerRef.current!)
      }),
      delay(100),
      filter(() => {
        return !selection.isCollapsed
      }),
      map(getTop),
      delay(200)
    ).subscribe((top) => {
      updateViewPosition(draft => {
        draft.opacity = 1
        draft.top = top
      })
    })
  }

  const mousedownSubscription = fromEvent<MouseEvent>(document, 'mousedown').subscribe((ev) => {
    if (ev.composedPath().includes(containerRef.current!)) {
      return
    }
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
      <div class="editor-toolbar" ref={containerRef} style={{
        left: p.left + 'px',
        top: p.top + 36 + 'px',
        pointerEvents: p.isHide ? 'none' : 'initial',
        opacity: p.opacity,
        transitionDuration: p.transitionDuration + 's'
      }}>
        <div class="editor-toolbar-item">
          <BlockTool/>
        </div>
        <div class="editor-toolbar-item">
          <Bold/>
        </div>
        <div class="editor-toolbar-item">
          <Italic/>
        </div>
        <div class="editor-toolbar-item">
          <StrikeThrough/>
        </div>
        <div class="editor-toolbar-item">
          <Underline/>
        </div>
      </div>
    )
  })
}
