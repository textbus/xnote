import { Fragment, getCurrentInstance, inject, onUnmounted, withAnnotation, withMark } from '@viewfly/core'
import { debounceTime, merge, Query, QueryStateType, Selection, Textbus } from '@textbus/core'

import css from './static-toolbar.scoped.scss'
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
import { AiTool } from '../tools/ai.tool'
import { LLMService } from '../../services/llm.service'

export interface StaticToolbarProps {
  theme?: 'dark' | 'light'
}

export const StaticToolbar = withAnnotation({
  providers: [RefreshService, ToolService]
}, withMark(css, function Toolbar(props: StaticToolbarProps) {
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

  const llmService = inject(LLMService, null)
  return () => {
    return (
      <div class={['toolbar', props.theme === 'dark' ? 'vfui-dark dark' : 'light', {}]}>
        <UndoTool/>
        <RedoTool/>
        <SplitLine/>
        {
          llmService && <AiTool/>
        }
        <InsertTool/>
        <SplitLine/>
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
        <LinkTool/>
        <CodeTool/>
        <TextColorTool/>
        <TextBackgroundColorTool/>
        <SplitLine/>
        <SubscriptTool/>
        <SuperscriptTool/>
        <CleanFormatsTool/>
        {
          query.queryComponent(TableComponent).state === QueryStateType.Enabled &&
          <Fragment key="table">
            <SplitLine/>
            <MergeCellsTool/>
            <SplitCellsTool/>
            <CellBackgroundTool/>
            <CellAlignTool/>
          </Fragment>
        }
      </div>
    )
  }
}))
