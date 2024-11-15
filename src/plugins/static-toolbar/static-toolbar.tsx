import { Fragment, getCurrentInstance, inject, onUnmounted, withAnnotation } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { debounceTime, delay, fromEvent, merge, Query, QueryStateType, Selection, tap, Textbus } from '@textbus/core'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'
import { useProduce } from '@viewfly/hooks'

import css from './static-toolbar.scoped.scss'
import { BoldTool } from '../tools/bold.tool'
import { ItalicTool } from '../tools/italic.tool'
import { StrikeThroughTool } from '../tools/strike-through.tool'
import { UnderlineTool } from '../tools/underline.tool'
import { RefreshService } from '../../services/refresh.service'
import { BlockTool } from '../tools/block.tool'
import { CodeTool } from '../tools/code.tool'
import { ColorTool } from '../tools/color.tool'
import { ToolbarItem } from '../../components/toolbar-item/toolbar-item'
import { AttrTool } from '../tools/attr.tool'
import { FontSizeTool } from '../tools/font-size.tool'
import { FontFamilyTool } from '../tools/font-family.tool'
import { LinkTool } from '../tools/link.tool'
import { MergeCellsTool } from '../tools/table/merge-cells.tool'
import { SplitCellsTool } from '../tools/table/split-cells.tool'
import { CellAlignTool } from '../tools/table/cell-align.tool'
import { TableComponent } from '../../textbus/components/table/table.component'
import { CellBackgroundTool } from '../tools/table/cell-background.tool'
import { UndoTool } from '../tools/undo.tool'
import { RedoTool } from '../tools/redo.tool'
import { InsertTool } from '../tools/insert.tool'
import { SplitLine } from '../tools/_common/split-line'
import { SubscriptTool } from '../tools/subscript.tool'
import { SuperscriptTool } from '../tools/superscript.tool'
import { CleanFormatsTool } from '../tools/clean-formats.tool'
import { ToolService } from '../tools/_common/tool.service'

export const StaticToolbar = withAnnotation({
  providers: [RefreshService, ToolService]
}, function Toolbar() {
  const selection = inject(Selection)
  const textbus = inject(Textbus)
  const query = inject(Query)
  const refreshService = inject(RefreshService)
  const viewDocument = inject(VIEW_DOCUMENT)
  const instance = getCurrentInstance()
  const subscription = merge(textbus.onChange, selection.onChange).pipe(
    debounceTime(20)
  ).subscribe(() => {
    refreshService.onRefresh.next()
    instance.markAsDirtied()
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const [styles, updateStyles] = useProduce({
    top: 0,
    opacity: 1,
  })

  subscription.add(fromEvent(document, 'scroll').pipe(
    tap(() => {
      updateStyles(draft => {
        draft.opacity = 0
      })
    }),
    debounceTime(100),
    tap(() => {
      const rect = viewDocument.getBoundingClientRect()
      if (rect.top < 10) {
        updateStyles(draft => {
          draft.top = Math.min(-rect.top + 10, rect.height - 100)
        })
      } else {
        updateStyles(draft => {
          draft.top = 0
        })
      }
    }),
    delay(100)
  ).subscribe(() => {
    updateStyles(draft => {
      draft.opacity = 1
    })
  }))


  return withScopedCSS(css, () => {
    const s = styles()
    return (
      <div class={['toolbar', {
        suspension: s.top === 0 ? '' : 'suspension'
      }]} style={{
        top: s.top + 'px',
        opacity: s.opacity,
        pointerEvents: s.opacity === 0 ? 'none' : 'initial',
      }}>
        <ToolbarItem>
          <UndoTool/>
        </ToolbarItem>
        <ToolbarItem>
          <RedoTool/>
        </ToolbarItem>
        <SplitLine/>
        <ToolbarItem>
          <InsertTool/>
        </ToolbarItem>
        <SplitLine/>
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
          <LinkTool/>
        </ToolbarItem>
        <ToolbarItem>
          <CodeTool/>
        </ToolbarItem>
        <ToolbarItem>
          <ColorTool/>
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
