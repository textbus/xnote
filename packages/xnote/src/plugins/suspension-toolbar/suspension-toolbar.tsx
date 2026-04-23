import { Fragment, getCurrentInstance, inject, onUnmounted, reactive, withAnnotation, withMark } from '@viewfly/core'
import { debounceTime, delay, fromEvent, merge, Query, QueryStateType, Selection, tap, Textbus } from '@textbus/core'
import { VIEW_CONTAINER } from '@textbus/platform-browser'

import css from './suspension-toolbar.scoped.scss'
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
import { AiTool } from '../tools/ai.tool'
import { LLMService } from '../../services/llm.service'

export interface SuspensionToolbarProps {
  theme?: 'dark' | 'light'
}

export const SuspensionToolbar = withAnnotation({
  providers: [RefreshService, ToolService]
}, withMark(css, function Toolbar(props: SuspensionToolbarProps) {
  const selection = inject(Selection)
  const textbus = inject(Textbus)
  const query = inject(Query)
  const refreshService = inject(RefreshService)
  const viewDocument = inject(VIEW_CONTAINER)
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

  const styles = reactive({
    top: 0,
    opacity: 1,
  })

  subscription.add(fromEvent(document, 'scroll').pipe(
    tap(() => {
      styles.opacity = 0
    }),
    debounceTime(100),
    tap(() => {
      const rect = viewDocument.getBoundingClientRect()
      if (rect.top < 10) {
        styles.top = Math.min(-rect.top + 10, rect.height - 100)
      } else {
        styles.top = 0
      }
    }),
    delay(100)
  ).subscribe(() => {
    styles.opacity = 1
  }))
  const llmService = inject(LLMService, null)
  return () => {
    return (
      <div class={['toolbar', props.theme, {
        suspension: styles.top === 0 ? '' : 'suspension'
      }]} style={{
        top: styles.top + 'px',
        opacity: styles.opacity,
        pointerEvents: styles.opacity === 0 ? 'none' : 'initial',
      }}>
        <div class="toolbar-tools">
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
      </div>
    )
  }
}))
