import { inject, InjectFlags, onUnmounted, provide } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { debounceTime, delay, filter, fromEvent, map, merge, Selection, Subscription, Textbus } from '@textbus/core'
import { SelectionBridge, VIEW_DOCUMENT } from '@textbus/platform-browser'
import { useProduce, useStaticRef } from '@viewfly/hooks'

import css from './toolbar.scoped.scss'
import { BoldTool } from '../_common/bold.tool'
import { ItalicTool } from '../_common/italic.tool'
import { StrikeThroughTool } from '../_common/strike-through.tool'
import { UnderlineTool } from '../_common/underline.tool'
import { RefreshService } from '../../services/refresh.service'
import { BlockTool } from './block-tool'
import { CodeTool } from '../_common/code.tool'
import { ColorTool } from '../_common/color.tool'

export function Toolbar() {
  provide(RefreshService)
  const selection = inject(Selection)
  const viewDocument = inject(VIEW_DOCUMENT)
  const bridge = inject(SelectionBridge)
  const textbus = inject(Textbus)
  const refreshService = inject(RefreshService, null, InjectFlags.Default)!

  const subscription = merge(textbus.onChange, selection.onChange).pipe(
    debounceTime(20)
  ).subscribe(() => {
    console.log(434343)
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
  const toolbarRef = useStaticRef<HTMLElement>()

  function getTop() {
    const docRect = viewDocument.getBoundingClientRect()
    const toolbarRect = toolbarRef.current!.getBoundingClientRect()
    const documentHeight = document.documentElement.clientHeight
    const selectionFocusRect = bridge.getRect({
      slot: selection.focusSlot!,
      offset: selection.focusOffset!
    })!

    const centerLeft = selectionFocusRect.left
    const toBottom = documentHeight - selectionFocusRect.top - selectionFocusRect.height > toolbarRect.height + 10
    const top = toBottom ?
      selectionFocusRect.top + selectionFocusRect.height - docRect.top + 10 :
      selectionFocusRect.top - toolbarRect.height - 10

    updateViewPosition(draft => {
      draft.isHide = false
      draft.transitionDuration = .15
      draft.left = centerLeft - docRect.left
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
        return !ev.composedPath().includes(toolbarRef.current!)
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
    if (ev.composedPath().includes(toolbarRef.current!)) {
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
      <div class="editor-toolbar" ref={toolbarRef} style={{
        left: p.left + 'px',
        top: p.top + 'px',
        pointerEvents: p.isHide ? 'none' : 'initial',
        opacity: p.opacity,
        transitionDuration: p.transitionDuration + 's'
      }}>
        <div class="editor-toolbar-item">
          <BlockTool/>
        </div>
        <div class="editor-toolbar-item">
          <BoldTool/>
        </div>
        <div class="editor-toolbar-item">
          <ItalicTool/>
        </div>
        <div class="editor-toolbar-item">
          <StrikeThroughTool/>
        </div>
        <div class="editor-toolbar-item">
          <UnderlineTool/>
        </div>
        <div class="editor-toolbar-item">
          <CodeTool/>
        </div>
        <div class="editor-toolbar-item">
          <ColorTool/>
        </div>
      </div>
    )
  })
}
