import { Application, createSignal, getCurrentInstance, inject, onUnmounted, watch } from '@viewfly/core'
import { Commander, fromEvent, Selection } from '@textbus/core'
import { Button, Input, Popover } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'
import { createApp } from '@viewfly/platform-browser'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'

import './comment-tool.scss'
import { commentFormatter } from '../../textbus/formatters/comment'
import { useCommonState } from './_common/common-state'
import { usePopupPosition } from '../hooks/popup-position'
import { RefreshService } from '../../services/refresh.service'
import { EditorService } from '../../services/editor.service'
import { I18nService } from '../../services/i18n.service'
import { CommentService } from '../../services/comment.service'

export interface CommentToolProps {
  hideToolbar?(): void
}

export function CommentTool(props: CommentToolProps) {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const refreshService = inject(RefreshService)
  const editorService = inject(EditorService)
  const commentService = inject(CommentService)
  const i18n = inject(I18nService)
  const isShow = createSignal(false)
  const value = createSignal('')

  async function send(ev: Event) {
    ev.preventDefault()
    const v = await commentService.createComment(value())
    commander.applyFormat(commentFormatter, v)
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
    const sub = fromEvent(document, 'mousedown').subscribe(() => {
      isShow.set(false)
    })
    onUnmounted(() => {
      sub.unsubscribe()
    })
    return () => {
      return (
        <div class="xnote-comment-tool-host">
          <Popover open={isShow()}
                   getContainer={getContainer}
                   showArrow={false}
                   noPadding={true}
                   onOpenChange={open => {
                     if (isDestroy && !open) {
                       editorService.hideInlineToolbar = false
                       editorService.changeLeftToolbarVisible(!open)
                       subApp?.destroy()
                     }
                   }}
                   getReferenceBox={() => popupPosition()}
                   content={
                     <form onSubmit={send} class="xnote-comment-tool-form" onMouseDown={ev => ev.stopPropagation()}>
                       <Input block={true} required size={'small'} placeholder={i18n.t('comment.placeholder')} onChange={v => {
                         value.set(v)
                       }} suffix={<Button type={'primary'} size={'small'} htmlType="submit">{i18n.t('comment.confirm')}</Button>}/>
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
        <IconGlyph name={'message'}/>
      </Button>
    )
  }
}
