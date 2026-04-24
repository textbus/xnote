import { createEffect, createSignal, getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
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

export interface LinkToolProps {
  hideToolbar?(): void
}

export function LinkTool(props: LinkToolProps) {
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
  }

  createEffect(isShow, (b) => {
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

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  return withScopedCSS(css, () => {
    return (
      <>
        <Button disabled={commonState().inSourceCode || commonState().readonly || selection.isCollapsed}
                size={'small'}
                chevronGapless={true}
                variant={'text'}
                inlineCompact={true}
                onClick={() => {
                  isShow.set(true)
                  props.hideToolbar?.()
                }}>
          <IconGlyph name={'link'}/>
        </Button>
        {
          <Popover open={isShow()}
                   getContainer={getContainer}
                   showArrow={false}
                   noPadding={true}
                   onOpenChange={open => isShow.set(open)}
                   getReferenceBox={() => popupPosition()}
                   content={
                     <form onSubmit={setLink} class={'p-1'}>
                       <Input block={true} size={'small'} placeholder={'请输入链接地址'} onChange={v => {
                         value.set(v)
                       }} suffix={<Button type={'primary'} size={'small'} htmlType="submit">确定</Button>}/>
                     </form>
                   }
          />
        }
      </>
    )
  })
}
