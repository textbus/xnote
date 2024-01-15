import { withScopedCSS } from '@viewfly/scoped-css'
import { inject, onUnmounted } from '@viewfly/core'
import { useProduce } from '@viewfly/hooks'

import css from './selection-mask.scoped.scss'
import { TableService } from '../table.service'
import { TableComponent } from '../table.component'
import { sum } from '../_utils'

export interface SelectionMaskProps {
  component: TableComponent
}

export function SelectionMask(props: SelectionMaskProps) {
  const tableService = inject(TableService)

  const [styles, updateStyles] = useProduce({
    visible: false,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 'auto',
    height: 'auto'
  })

  const sub = tableService.onSelectColumns.subscribe(range => {
    if (!range) {
      updateStyles(draft => {
        draft.visible = false
      })
      return
    }
    const state = props.component.state

    console.log(range)

    updateStyles(draft => {
      draft.visible = true
      draft.top = 0
      draft.bottom = 0
      draft.left = sum(state.layoutWidth.slice(0, range.start))
      draft.width = sum(state.layoutWidth.slice(range.start, range.end + 1)) - 1 + 'px'
      draft.height = 'auto'
    })
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  return withScopedCSS(css, () => {
    const style = styles()
    return (
      <div class="mask" style={{
        display: style.visible ? 'block' : 'none',
        left: style.left + 'px',
        top: style.top + 'px',
        width: style.width,
        height: style.height,
        bottom: style.bottom + 'px'
      }}/>
    )
  })
}
