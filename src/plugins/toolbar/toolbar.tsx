import { createRef, inject, InjectFlags, onUnmounted, provide } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { debounceTime, delay, filter, fromEvent, map, merge, Selection, Subscription, Textbus } from '@textbus/core'
import { SelectionBridge, VIEW_DOCUMENT } from '@textbus/platform-browser'
import { useProduce } from '@viewfly/hooks'

import css from './toolbar.scoped.scss'
import { BoldTool } from '../_common/bold.tool'
import { ItalicTool } from '../_common/italic.tool'
import { StrikeThroughTool } from '../_common/strike-through.tool'
import { UnderlineTool } from '../_common/underline.tool'
import { RefreshService } from '../../services/refresh.service'
import { BlockTool } from '../_common/block-tool'
import { CodeTool } from '../_common/code.tool'
import { ColorTool } from '../_common/color.tool'
import { ToolbarItem } from '../../components/toolbar-item/toolbar-item'
import { AttrTool } from '../_common/attr-tool'
import { FontSizeTool } from '../_common/font-size.tool'
import { FontFamilyTool } from '../_common/font-family'
import { EditorService } from '../../services/editor.service'
import { SourceCodeComponent } from '../../textbus/components/source-code/source-code.component'

export function Toolbar() {
  provide(RefreshService)
  const selection = inject(Selection)
  const viewDocument = inject(VIEW_DOCUMENT)
  const bridge = inject(SelectionBridge)
  const textbus = inject(Textbus)
  const editorService = inject(EditorService)
  const refreshService = inject(RefreshService, null, InjectFlags.Default)!

  const subscription = merge(textbus.onChange, selection.onChange).pipe(
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
  const toolbarRef = createRef<HTMLElement>()

  function getTop() {
    const docRect = viewDocument.getBoundingClientRect()
    const toolbarRect = toolbarRef.current!.getBoundingClientRect()
    // const documentHeight = document.documentElement.clientHeight
    const selectionFocusRect = bridge.getRect({
      slot: selection.focusSlot!,
      offset: selection.focusOffset!
    })
    if (!selectionFocusRect) {
      return null
    }

    // console.log(selectionFocusRect.top, toolbarRect.height)
    const centerLeft = selectionFocusRect.left
    const toBottom = selectionFocusRect.top < toolbarRect.height + 10
    const top = toBottom ?
      selectionFocusRect.top + selectionFocusRect.height - docRect.top + 10 :
      selectionFocusRect.top - docRect.top - toolbarRect.height - 10

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
      if (top !== null) {
        updateViewPosition(draft => {
          draft.top = top
        })
      }
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
        return !selection.isCollapsed && !(selection.commonAncestorComponent instanceof SourceCodeComponent)
      }),
      map(getTop),
      delay(200),
    ).subscribe((top) => {
      if (top !== null) {
        updateViewPosition(draft => {
          draft.opacity = 1
          draft.top = top
        })
      }
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
      <div class="toolbar" ref={toolbarRef} style={{
        left: p.left + 'px',
        top: p.top + 'px',
        pointerEvents: p.isHide ? 'none' : 'initial',
        opacity: p.opacity,
        display: editorService.hideInlineToolbar ? 'none' : '',
        transitionDuration: p.transitionDuration + 's'
      }}>
        <ToolbarItem>
          <BlockTool/>
        </ToolbarItem>
        <ToolbarItem>
          <AttrTool/>
        </ToolbarItem>
        <ToolbarItem>
          <BoldTool/>
        </ToolbarItem>
        <ToolbarItem>
          <ItalicTool/>
        </ToolbarItem>
        <ToolbarItem>
          <StrikeThroughTool/>
        </ToolbarItem>
        <ToolbarItem>
          <UnderlineTool/>
        </ToolbarItem>
        <ToolbarItem>
          <FontSizeTool/>
        </ToolbarItem>
        <ToolbarItem>
          <FontFamilyTool/>
        </ToolbarItem>
        <ToolbarItem>
          <CodeTool/>
        </ToolbarItem>
        <ToolbarItem>
          <ColorTool/>
        </ToolbarItem>
      </div>
    )
  })
}
