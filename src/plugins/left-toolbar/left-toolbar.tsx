import { withScopedCSS } from '@viewfly/scoped-css'
import { inject, onUnmounted, provide, useSignal } from '@viewfly/core'
import { useProduce } from '@viewfly/hooks'
import { Selection, throttleTime } from '@textbus/core'

import css from './left-toolbar.scoped.scss'
import { RefreshService } from '../../services/refresh.service'
import { LeftToolbarService } from '../../services/left-toolbar.service'
import { BoldTool } from '../_common/bold.tool'
import { ItalicTool } from '../_common/italic.tool'
import { StrikeThroughTool } from '../_common/strike-through.tool'
import { UnderlineTool } from '../_common/underline.tool'
import { DomAdapter } from '@textbus/platform-browser'

export function LeftToolbar() {
  provide(RefreshService)
  const adapter = inject(DomAdapter)
  const selection = inject(Selection)
  const leftToolbarService = inject(LeftToolbarService)

  const [positionSignal, updatePosition] = useProduce({
    left: 0,
    top: 0,
    display: false
  })

  let timer: any = 0
  const subscription = leftToolbarService.onComponentActive.subscribe((c) => {
    const position = positionSignal()
    clearTimeout(timer)
    if (!c) {
      if (position.display) {
        timer = setTimeout(() => {
          updatePosition(draft => {
            draft.display = false
          })
        }, 200)
      }
      return
    }
    const nativeNode = adapter.getNativeNodeByComponent(c)!
    updatePosition(draft => {
      draft.display = true
      draft.left = nativeNode.offsetLeft
      draft.top = nativeNode.offsetTop
    })
  })

  subscription.add(selection.onChange.pipe(throttleTime(30)).subscribe(() => {
    leftToolbarService.onRefresh.next()
  }))

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const isEmptyBlock = useSignal(true)

  return withScopedCSS(css, () => {
    const position = positionSignal()
    return (
      <div class="editor-left-toolbar">
        <div class="editor-left-btn-wrap" style={{
          left: position.left + 'px',
          top: position.top + 'px',
          display: position.display ? 'block' : 'none'
        }}>
          <button type="button" class="editor-left-btn">
            {
              isEmptyBlock() ?
                <span>
                  <i style="font-size: 18px" class="xnote-icon-components"></i>
                  <i style="font-size: 12px" class="xnote-icon-more"></i>
                </span>
                :
                <span>
                  <i class="bi bi-plus"></i>
                </span>
            }
          </button>
          <div class={['tools']}>
            <BoldTool/>
            <ItalicTool/>
            <StrikeThroughTool/>
            <UnderlineTool/>
          </div>
        </div>
      </div>
    )
  })
}
