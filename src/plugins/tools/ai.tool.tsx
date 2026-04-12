import { inject, onUnmounted, reactive } from '@viewfly/core'
import { SelectionBridge, VIEW_CONTAINER } from '@textbus/platform-browser'
import { withScopedCSS } from '@viewfly/scoped-css'
import { Commander, fromEvent, Selection } from '@textbus/core'

import css from './ai-tool.scoped.scss'
import { Popup } from '../../components/popup/popup'
import { Button } from '../../components/button/button'
import { EditorService } from '../../services/editor.service'
import { useCommonState } from './_common/common-state'
import { Dropdown } from '../../components/dropdown/dropdown'
import { MenuItem } from '../../components/menu-item/menu-item'
import { Divider } from '../../components/divider/divider'
import { LLMService } from '../../services/llm.service'

export interface AiToolProps {
  hideToolbar?(): void
}

export function AiTool(props: AiToolProps) {
  const llmService = inject(LLMService)
  const selectionBridge = inject(SelectionBridge)
  const selection = inject(Selection)
  const commander = inject(Commander)
  const editorService = inject(EditorService)
  const container = inject(VIEW_CONTAINER)

  let isClickFromSelf = false
  const sub = fromEvent(document, 'click').subscribe(() => {
    if (isClickFromSelf) {
      isClickFromSelf = false
      return
    }
    editorService.hideInlineToolbar = false
    viewModel.showTranslation = false
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const viewModel = reactive({
    showTranslation: false,
    content: ''
  })

  function translation() {
    viewModel.showTranslation = true
    viewModel.content = ''
    props.hideToolbar?.()
    llmService.translate({
      text: document.getSelection()!.toString(),
      targetLanguage: 'English'
    }).subscribe(text => {
      viewModel.content += text
    })
  }

  function continueContent() {
    viewModel.content = ''
    llmService.continue({
      text: document.getSelection()!.toString()
    }).subscribe((text) => {
      viewModel.content += text
    })
  }

  function insert() {
    if (viewModel.content) {
      commander.insert(viewModel.content)
    }
    props.hideToolbar?.()
  }

  function replace() {
    props.hideToolbar?.()
  }

  const commonState = useCommonState()

  return withScopedCSS(css, () => {
    const containerRect = container.getBoundingClientRect()
    const rect = viewModel.showTranslation ? selectionBridge.getRect({
      slot: selection.focusSlot!,
      offset: selection.focusOffset!
    }) : {} as any

    console.log(rect)
    return (
      <>
        <Dropdown width={'160px'} menu={
          !viewModel.showTranslation ? <div onClick={() => isClickFromSelf = true}>
            <MenuItem icon={<span class="xnote-icon-continuation"></span>} onClick={continueContent}>续写</MenuItem>
            <MenuItem icon={<span class="xnote-icon-magic-wand"></span>}>润色</MenuItem>
            <MenuItem icon={<span class="xnote-icon-simplify"></span>}>简化内容</MenuItem>
            <MenuItem icon={<span class="xnote-icon-check"></span>}>丰富内容</MenuItem>
            <Divider/>
            <MenuItem icon={<span class="xnote-icon-translation"></span>} onClick={translation}>翻译</MenuItem>
            <MenuItem icon={<span class="xnote-icon-summary"></span>}>总结并插入</MenuItem>
          </div> : null
        }>
          <Button arrow={true} disabled={commonState().inSourceCode || commonState().readonly}>
            <span class="xnote-icon-ai"></span>
          </Button>
        </Dropdown>
        {
          viewModel.showTranslation &&
          <Popup left={rect.left - containerRect.left} top={rect.top + rect.height - containerRect.top}>
            <div onClick={() => {
              isClickFromSelf = true
            }} class="input-group">
              <div class="ai-content">
                {viewModel.content}
              </div>
              <div class="btn-group">
                <Button type="button" onClick={replace}>替换</Button>
                <Button type="button" onClick={insert}>插入</Button>
              </div>
            </div>
          </Popup>
        }
      </>
    )
  })
}
