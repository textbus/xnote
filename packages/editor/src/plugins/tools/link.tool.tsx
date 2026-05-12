import { Application, createSignal, getCurrentInstance, inject, onUnmounted, watch } from '@viewfly/core'
import { Commander, Selection } from '@textbus/core'
import { Button, Input, Popover } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import './link-tool.scss'
import { linkFormatter } from '../../textbus/formatters/link'
import { useCommonState } from './_common/common-state'
import { usePopupPosition } from '../hooks/popup-position'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'
import { RefreshService } from '../../services/refresh.service'
import { EditorService } from '../../services/editor.service'
import { createApp } from '@viewfly/platform-browser'
import { I18nService } from '../../services/i18n.service'

export interface LinkToolProps {
  hideToolbar?(): void
}

export function LinkTool(props: LinkToolProps) {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const refreshService = inject(RefreshService)
  const editorService = inject(EditorService)
  const i18n = inject(I18nService)
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

  const SubApp = function SubApp() {
    return () => {
      return (
        <div class="xnote-link-tool-host">
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
                     <form onSubmit={setLink} class="xnote-link-tool-form">
                       <Input block={true} required size={'small'} placeholder={i18n.t('link.urlPlaceholder')} onChange={v => {
                         value.set(v)
                       }} suffix={<Button type={'primary'} size={'small'} htmlType="submit">{i18n.t('link.confirm')}</Button>}/>
                     </form>
                   }
          />
        </div>
      )
    }
  }

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
}
