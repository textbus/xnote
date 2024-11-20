import { Fragment, getCurrentInstance, inject, onUnmounted, withAnnotation } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { debounceTime, merge, Query, QueryStateType, Selection, Textbus } from '@textbus/core'

import css from './static-toolbar.scoped.scss'
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
import { TextColorTool } from '../tools/text-color.tool'
import { TextBackgroundColorTool } from '../tools/text-background-color.tool'

export interface StaticToolbarProps {
  theme?: 'dark' | 'light'
}

export const StaticToolbar = withAnnotation({
  providers: [RefreshService, ToolService]
}, function Toolbar(props: StaticToolbarProps) {
  const selection = inject(Selection)
  const textbus = inject(Textbus)
  const query = inject(Query)
  const refreshService = inject(RefreshService)
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


  return withScopedCSS(css, () => {
    return (
      <div class={['toolbar', props.theme]}>
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
