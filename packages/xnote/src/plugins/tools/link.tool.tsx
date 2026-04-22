import { createSignal, inject, onUnmounted } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { Commander, fromEvent } from '@textbus/core'

import css from './link-tool.scoped.scss'
import { Popup } from '../../components/popup/popup'
import { Button } from '../../components/button/button'
import { linkFormatter } from '../../textbus/formatters/link'
import { EditorService } from '../../services/editor.service'
import { useCommonState } from './_common/common-state'
import { usePopupPosition } from '../hooks/popup-position'

export interface LinkToolProps {
  hideToolbar?(): void
}

export function LinkTool(props: LinkToolProps) {
  const commander = inject(Commander)
  const editorService = inject(EditorService)

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

  const popupPosition = usePopupPosition()
  return withScopedCSS(css, () => {
    const rect = popupPosition()
    return (
      <span>
        <Button disabled={commonState().inSourceCode || commonState().readonly} onClick={() => {
          isShow.set(true)
          isClickFromSelf = true
          props.hideToolbar?.()
        }}><span class="xnote-icon-link"></span></Button>
        {
          isShow() &&
          <Popup left={rect.left} top={rect.top}>
            <form onSubmit={setLink} onClick={() => {
              isClickFromSelf = true
            }} class="input-group">
              <input onChange={ev => {
                value.set((ev.target as any).value)
              }} placeholder="请输入链接地址" type="text"/>
              <Button type="submit">确定</Button>
            </form>
          </Popup>
        }
      </span>
    )
  })
}
