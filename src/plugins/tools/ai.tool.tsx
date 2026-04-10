import { createSignal, inject, onUnmounted } from '@viewfly/core'
import { SelectionBridge, VIEW_CONTAINER } from '@textbus/platform-browser'
import { withScopedCSS } from '@viewfly/scoped-css'
import { Commander, fromEvent, Selection } from '@textbus/core'

import css from './link-tool.scoped.scss'
import { Popup } from '../../components/popup/popup'
import { Button } from '../../components/button/button'
import { linkFormatter } from '../../textbus/formatters/link'
import { EditorService } from '../../services/editor.service'
import { useCommonState } from './_common/common-state'
import { Dropdown } from '../../components/dropdown/dropdown'
import { MenuItem } from '../../components/menu-item/menu-item'
import { Divider } from '../../components/divider/divider'

export interface AiToolProps {
  hideToolbar?(): void
}

export function AiTool(props: AiToolProps) {
  const selectionBridge = inject(SelectionBridge)
  const selection = inject(Selection)
  const commander = inject(Commander)
  const editorService = inject(EditorService)
  const container = inject(VIEW_CONTAINER)

  const isShow = createSignal(false)
  const value = createSignal('')

  function setLink(ev: Event) {
    ev.preventDefault()
    commander.applyFormat(linkFormatter, {
      href: value(),
      target: '_blanK'
    } as any)
    isShow.set(false)
  }

  let isClickFromSelf = false
  const sub = fromEvent(document, 'click').subscribe(() => {
    if (isClickFromSelf) {
      isClickFromSelf = false
      return
    }
    editorService.hideInlineToolbar = false
    isShow.set(false)
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()

  return withScopedCSS(css, () => {
    const containerRect = container.getBoundingClientRect()
    const rect = isShow() ? selectionBridge.getRect({
      slot: selection.focusSlot!,
      offset: selection.focusOffset!
    }) : {} as any
    return (
      <Dropdown width={'160px'} menu={
        <>
          <MenuItem icon={<span class="xnote-icon-continuation"></span>}>续写</MenuItem>
          <MenuItem icon={<span class="xnote-icon-magic-wand"></span>}>润色</MenuItem>
          <MenuItem icon={<span class="xnote-icon-simplify"></span>}>简化</MenuItem>
          <MenuItem icon={<span class="xnote-icon-check"></span>}>检查拼写错误</MenuItem>
          <Divider/>
          <MenuItem icon={<span class="xnote-icon-translation"></span>}>翻译</MenuItem>
          <MenuItem icon={<span class="xnote-icon-summary"></span>}>总结并插入</MenuItem>
        </>
      }>
        <Button arrow={true} disabled={commonState().inSourceCode || commonState().readonly} onClick={() => {
          isShow.set(true)
          isClickFromSelf = true
          props.hideToolbar?.()
        }}><span class="xnote-icon-ai"></span></Button>
      </Dropdown>
      // <span>
      //
      //   {
      //     isShow() &&
      //     <Popup left={rect.left - containerRect.left} top={rect.top + rect.height - containerRect.top}>
      //       <form onSubmit={setLink} onClick={() => {
      //         isClickFromSelf = true
      //       }} class="input-group">
      //         <input onChange={ev => {
      //           value.set((ev.target as any).value)
      //         }} placeholder="请输入链接地址" type="text"/>
      //         <Button type="submit">确定</Button>
      //       </form>
      //     </Popup>
      //   }
      // </span>
    )
  })
}
