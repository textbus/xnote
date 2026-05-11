import { Application, createSignal, getCurrentInstance, inject, onUnmounted, watch, withMark } from '@viewfly/core'
import { Commander, Selection } from '@textbus/core'
import { Button, Input, Popover } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import css from './link-tool.scoped.scss'
import { linkFormatter } from '../../textbus/formatters/link'
import { useCommonState } from './_common/common-state'
import { usePopupPosition } from '../hooks/popup-position'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'
import { RefreshService } from '../../services/refresh.service'
import { EditorService } from '../../services/editor.service'
import { createApp } from '@viewfly/platform-browser'

export interface LinkToolProps {
  hideToolbar?(): void
}

export const LinkTool = withMark(css, function LinkTool(props: LinkToolProps) {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const refreshService = inject(RefreshService)
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
    editorService.hideInlineToolbar = false
    subApp?.destroy()
  }

  watch(isShow, (b) => {
    editorService.changeLeftToolbarVisible(!b)
  })

  const commonState = useCommonState()

  const popupPosition = usePopupPosition()
  const viewDocument = inject(VIEW_DOCUMENT)

  function getContainer() {
    return viewDocument
  }

  const instance = getCurrentInstance()

  const subscription = refreshService.onRefresh.subscribe(() => {
    instance.markAsDirtied()
  })

  let isDestroy = false
  onUnmounted(() => {
    isDestroy = true
    subscription.unsubscribe()
  })

  const SubApp = withMark(css, function SubApp() {
    return () => {
      return (
        <div class={'link-tool'}>
          <Popover open={isShow()}
                   getContainer={getContainer}
                   showArrow={false}
                   noPadding={true}
                   onOpenChange={open => {
                     if (isDestroy) {
                       editorService.hideInlineToolbar = false
                       editorService.changeLeftToolbarVisible(!open)
                       subApp?.destroy()
                     }
                   }}
                   getReferenceBox={() => popupPosition()}
                   content={
                     <form onSubmit={setLink} class={'p-1'}>
                       <Input block={true} required size={'small'} placeholder={'请输入链接地址'} onChange={v => {
                         value.set(v)
                       }} suffix={<Button type={'primary'} size={'small'} htmlType="submit">确定</Button>}/>
                     </form>
                   }
          />
        </div>
      )
    }
  })

  let subApp: Application | null = null

  return () => {
    return (
      <Button disabled={commonState().inSourceCode || commonState().readonly || selection.isCollapsed || !selection.isSelected}
              size={'small'}
              chevronGapless={true}
              variant={'text'}
              inlineCompact={true}
              onClick={() => {
                subApp = createApp(<SubApp/>)
                subApp.mount(viewDocument)
                isShow.set(true)
                props.hideToolbar?.()
              }}>
        <IconGlyph name={'link'}/>
      </Button>
    )
  }
})
