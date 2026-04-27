import { createRef, withMark, Fragment, getCurrentInstance, inject, onUnmounted, reactive, withAnnotation } from '@viewfly/core'
import {
  debounceTime,
  delay,
  filter,
  fromEvent,
  merge,
  Query, QueryStateType,
  RootComponentRef,
  Selection,
  Subscription, tap,
  Textbus
} from '@textbus/core'
import { DomAdapter, SelectionBridge, VIEW_CONTAINER } from '@textbus/platform-browser'

import css from './inline-toolbar.scoped.scss'
import { BoldTool } from '../tools/bold.tool'
import { ItalicTool } from '../tools/italic.tool'
import { StrikeThroughTool } from '../tools/strike-through.tool'
import { UnderlineTool } from '../tools/underline.tool'
import { RefreshService } from '../../services/refresh.service'
import { BlockTool } from '../tools/block.tool'
import { CodeTool } from '../tools/code.tool'
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
import { useCommonState } from '../tools/_common/common-state'
import { ImageComponent } from '../../textbus/components/image/image.component'
import { VideoComponent } from '../../textbus/components/video/video.component'
import { AiTool } from '../tools/ai.tool'
import { LLMService } from '../../services/llm.service'
import { Popover } from '@viewfly/ui-components'

export interface InlineToolbarProps {
  theme?: 'dark' | 'light'
}

export const InlineToolbar = withAnnotation({
  providers: [RefreshService, ToolService]
}, withMark(css, function Toolbar(props: InlineToolbarProps) {
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
    debounceTime(20),
    tap(() => {
      refreshService.onRefresh.next()
    }),
    delay(200)
  ).subscribe(() => {
    if (viewPosition.open) {
      editorService.changeLeftToolbarVisible(true)
    }
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const viewPosition = reactive({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    open: false,
  })

  let mouseupSubscription = new Subscription()
  const toolbarRef = createRef<HTMLElement>()

  const commonState = useCommonState()

  function updateRect() {
    if (!selection.isSelected) {
      return
    }
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
        viewPosition.left = startRect.left
        viewPosition.top = startRect.top
        viewPosition.width = width
        viewPosition.height = endEle.bottom - startRect.top
      } else {
        const rect = bridge.getRect({
          slot: selection.focusSlot!,
          offset: selection.focusOffset!
        })!
        viewPosition.left = rect.left
        viewPosition.top = rect.top
        viewPosition.width = rect.width
        viewPosition.height = rect.height
      }
    } else if (commonState().selectEmbed) {
      const component = selection.startSlot?.getContentAtIndex(selection.startOffset!)
      if (component instanceof ImageComponent || component instanceof VideoComponent) {
        const nativeNode = adapter.getNativeNodeByComponent(component)
        if (nativeNode) {
          const rect = nativeNode.getBoundingClientRect()
          Object.assign(viewPosition, rect)
        }
      }
    } else {
      const rect = bridge.getRect({
        slot: selection.focusSlot!,
        offset: selection.focusOffset!
      })
      if (!rect) {
        viewPosition.open = false
        return
      }
      viewPosition.left = rect.left
      viewPosition.top = rect.top
      viewPosition.width = rect.width
      viewPosition.height = rect.height
    }
  }

  const sub = merge(textbus.onChange).pipe(debounceTime(100)).subscribe(() => {
    // if (selection.isSelected && !selection.isCollapsed) {
    //   updateRect()
    //   viewPosition.open = true
    // } else {
    //   viewPosition.open = false
    // }
    editorService.changeLeftToolbarVisible(true)
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
        return !ev.composedPath().includes(toolbarRef.value!)
      }),
      delay(100),
      filter(() => {
        return !selection.isCollapsed && !(selection.commonAncestorComponent instanceof SourceCodeComponent)
      }),
      delay(200),
    ).subscribe(() => {
      if (selection.isSelected && !selection.isCollapsed) {
        updateRect()
        viewPosition.open = true
        editorService.changeLeftToolbarVisible(false)
      } else {
        viewPosition.open = false
        editorService.changeLeftToolbarVisible(true)
      }
    })
  }

  const mousedownSubscription = fromEvent<MouseEvent>(document, 'mousedown').subscribe((ev) => {
    if (ev.composedPath().includes(toolbarRef.value!)) {
      return
    }
    mouseupSubscription.unsubscribe()
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

  function getContainer() {
    return viewDocument
  }

  const llmService = inject(LLMService, null)
  return () => {
    return (
      <Popover showArrow={false}
               noPadding
               getContainer={getContainer}
               getReferenceBox={() => {
                 updateRect()
                 return viewPosition
               }}
               onOpenChange={(v) => viewPosition.open = v}
               open={viewPosition.open && !editorService.hideInlineToolbar}
               content={
                 <div class={['toolbar', props.theme]}>
                   {
                     llmService && <AiTool hideToolbar={hideToolbar}/>
                   }
                   <BlockTool/>
                   <AttrTool/>
                   <SplitLine/>
                   <BoldTool/>
                   <ItalicTool/>
                   <StrikeThroughTool/>
                   <UnderlineTool/>
                   <SplitLine/>
                   <FontSizeTool/>
                   <FontFamilyTool/>
                   <SplitLine/>
                   <LinkTool hideToolbar={hideToolbar}/>
                   <CodeTool/>
                   <TextColorTool/>
                   <TextBackgroundColorTool/>
                   <SplitLine/>
                   <SubscriptTool/>
                   <SuperscriptTool/>
                   <CleanFormatsTool/>
                   {
                     query.queryComponent(TableComponent).state === QueryStateType.Enabled && <Fragment key="table">
                       <SplitLine/>
                       <MergeCellsTool/>
                       <SplitCellsTool/>
                       <CellBackgroundTool/>
                       <CellAlignTool/>
                     </Fragment>
                   }
                 </div>
               }>
      </Popover>
    )
  }
}))
