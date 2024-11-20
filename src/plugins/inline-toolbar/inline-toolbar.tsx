import { createRef, Fragment, getCurrentInstance, inject, onUnmounted, withAnnotation } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import {
  debounceTime,
  delay,
  filter,
  fromEvent,
  map,
  merge,
  Query, QueryStateType,
  RootComponentRef,
  Selection,
  Subscription,
  Textbus
} from '@textbus/core'
import { DomAdapter, Rect, SelectionBridge, VIEW_CONTAINER } from '@textbus/platform-browser'
import { useProduce } from '@viewfly/hooks'

import css from './inline-toolbar.scoped.scss'
import { BoldTool } from '../tools/bold.tool'
import { ItalicTool } from '../tools/italic.tool'
import { StrikeThroughTool } from '../tools/strike-through.tool'
import { UnderlineTool } from '../tools/underline.tool'
import { RefreshService } from '../../services/refresh.service'
import { BlockTool } from '../tools/block.tool'
import { CodeTool } from '../tools/code.tool'
import { ToolbarItem } from '../../components/toolbar-item/toolbar-item'
import { AttrTool } from '../tools/attr.tool'
import { FontSizeTool } from '../tools/font-size.tool'
import { FontFamilyTool } from '../tools/font-family.tool'
import { EditorService } from '../../services/editor.service'
import { SourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { LinkTool } from '../tools/link.tool'
import { MergeCellsTool } from '../tools/table/merge-cells.tool'
import { SplitCellsTool } from '../tools/table/split-cells.tool'
import { CellAlignTool } from '../tools/table/cell-align.tool'
import { TableComponent } from '../../textbus/components/table/table.component'
import { sum } from '../../textbus/components/table/_utils'
import { CellBackgroundTool } from '../tools/table/cell-background.tool'
import { SplitLine } from '../tools/_common/split-line'
import { SubscriptTool } from '../tools/subscript.tool'
import { SuperscriptTool } from '../tools/superscript.tool'
import { CleanFormatsTool } from '../tools/clean-formats.tool'
import { ToolService } from '../tools/_common/tool.service'
import { TextColorTool } from '../tools/text-color.tool'
import { TextBackgroundColorTool } from '../tools/text-background-color.tool'

export interface InlineToolbarProps {
  theme?: 'dark' | 'light'
}

export const InlineToolbar = withAnnotation({
  providers: [RefreshService, ToolService]
}, function Toolbar(props: InlineToolbarProps) {
  const selection = inject(Selection)
  const viewDocument = inject(VIEW_CONTAINER)
  const rootComponentRef = inject(RootComponentRef)
  const adapter = inject(DomAdapter)
  const bridge = inject(SelectionBridge)
  const query = inject(Query)
  const textbus = inject(Textbus)
  const editorService = inject(EditorService)
  const refreshService = inject(RefreshService)

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
    // const toolbarRect = toolbarRef.current!.getBoundingClientRect()
    const toolbarHeight = 36
    // const documentHeight = document.documentElement.clientHeight
    let selectionFocusRect: Rect | null = null
    const commonAncestorComponent = selection.commonAncestorComponent
    if (commonAncestorComponent instanceof TableComponent) {
      const normalizedSlots = commonAncestorComponent.getSelectedNormalizedSlots()
      if (normalizedSlots) {
        const slots = normalizedSlots.map(item => {
          return item.cells.filter(i => {
            return i.visible
          }).map(cell => {
            return cell.raw.slot
          })
        }).flat()
        const startSlot = slots.at(0)!
        const endSlot = slots.at(-1)!
        const rect = commonAncestorComponent.getSelectedRect()!
        const startRect = (adapter.getNativeNodeBySlot(startSlot) as HTMLElement).getBoundingClientRect()
        const endEle = (adapter.getNativeNodeBySlot(endSlot) as HTMLElement).getBoundingClientRect()
        const width = sum(commonAncestorComponent.state.columnsConfig.slice(rect.x1, rect.x2))
        selectionFocusRect = {
          left: startRect.left + width / 2,
          // left: Math.max(startRect.left + width / 2, toolbarRect.width / 2 + 10 - docRect.left),
          top: startRect.top,
          height: endEle.bottom - startRect.top,
          width
        }
      } else {
        selectionFocusRect = bridge.getRect({
          slot: selection.focusSlot!,
          offset: selection.focusOffset!
        })
      }
    } else {
      selectionFocusRect = bridge.getRect({
        slot: selection.focusSlot!,
        offset: selection.focusOffset!
      })
    }
    if (!selectionFocusRect) {
      return null
    }

    const centerLeft = selectionFocusRect.left
    const toBottom = selectionFocusRect.top < toolbarHeight + 10
    const top = toBottom ?
      selectionFocusRect.top + selectionFocusRect.height - docRect.top + 10 :
      selectionFocusRect.top - docRect.top - toolbarHeight - 10

    updateViewPosition(draft => {
      draft.transitionDuration = .15
      draft.left = centerLeft - docRect.left
      // draft.left = Math.max(centerLeft - docRect.left, toolbarRect.width / 2 + 10 - docRect.left)
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
    const docElement = adapter.getNativeNodeByComponent(rootComponentRef.component)!
    mouseupSubscription = fromEvent<MouseEvent>(docElement, 'mouseup').pipe(
      delay(),
      filter(ev => {
        const c = selection.commonAncestorComponent
        if (c instanceof TableComponent) {
          const b = !c.ignoreSelectionChanges
          c.ignoreSelectionChanges = false
          return b
        }
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
          draft.isHide = false
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

  const instance = getCurrentInstance()

  function hideToolbar() {
    editorService.hideInlineToolbar = true
    instance.markAsDirtied()
  }

  onUnmounted(() => {
    mousedownSubscription.unsubscribe()
    mouseupSubscription.unsubscribe()
  })

  return withScopedCSS(css, () => {
    const p = viewPosition()
    return (
      <div class={['toolbar', props.theme]} ref={toolbarRef} style={{
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
        <SplitLine/>
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
        <SplitLine/>
        <ToolbarItem>
          <FontSizeTool/>
        </ToolbarItem>
        <ToolbarItem>
          <FontFamilyTool/>
        </ToolbarItem>
        <SplitLine/>
        <ToolbarItem>
          <LinkTool hideToolbar={hideToolbar}/>
        </ToolbarItem>
        <ToolbarItem>
          <CodeTool/>
        </ToolbarItem>
        <ToolbarItem>
          <TextColorTool/>
        </ToolbarItem>
        <ToolbarItem>
          <TextBackgroundColorTool/>
        </ToolbarItem>
        <SplitLine/>
        <ToolbarItem>
          <SubscriptTool/>
        </ToolbarItem>
        <ToolbarItem>
          <SuperscriptTool/>
        </ToolbarItem>
        <ToolbarItem>
          <CleanFormatsTool/>
        </ToolbarItem>
        {
          query.queryComponent(TableComponent).state === QueryStateType.Enabled && <Fragment key="table">
            <SplitLine/>
            <ToolbarItem>
              <MergeCellsTool/>
            </ToolbarItem>
            <ToolbarItem>
              <SplitCellsTool/>
            </ToolbarItem>
            <ToolbarItem>
              <CellBackgroundTool/>
            </ToolbarItem>
            <ToolbarItem>
              <CellAlignTool/>
            </ToolbarItem>
          </Fragment>
        }
      </div>
    )
  })
})
