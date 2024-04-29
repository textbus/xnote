import { withScopedCSS } from '@viewfly/scoped-css'
import { inject, onUnmounted, StaticRef } from '@viewfly/core'
import { useProduce } from '@viewfly/hooks'

import css from './selection-mask.scoped.scss'
import { TableService } from '../table.service'
import { TableComponent } from '../table.component'
import { sum } from '../_utils'

export interface SelectionMaskProps {
  component: TableComponent
  tableRef: StaticRef<HTMLTableElement>
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

  let isShowColumn = false
  let isShowRow = false
  const sub = tableService.onSelectColumns.subscribe(range => {
    if (!range) {
      if (!isShowRow) {
        updateStyles(draft => {
          draft.visible = false
        })
      }
      isShowColumn = false
      return
    }
    isShowColumn = true
    const state = props.component.state

    updateStyles(draft => {
      draft.visible = true
      draft.top = 0
      draft.bottom = 0
      draft.left = sum(state.layoutWidth.slice(0, range.start))
      // draft.right = 0
      draft.width = sum(state.layoutWidth.slice(range.start, range.end + 1)) - 1 + 'px'
      draft.height = 'auto'
    })
  }).add(tableService.onSelectRows.subscribe(range => {
    if (!range) {
      if (!isShowColumn) {
        updateStyles(draft => {
          draft.visible = false
        })
      }
      isShowRow = false
      return
    }
    isShowRow = true

    updateStyles(draft => {
      const trs = Array.from(props.tableRef.current!.rows)
      draft.visible = true
      draft.top = sum(trs.slice(0, range.start).map(i => i.offsetHeight))
      draft.left = 0
      draft.right = 0
      draft.bottom = 0
      draft.height = sum(trs.slice(range.start, range.end + 1).map(i => i.offsetHeight)) - 1 + 'px'
      draft.width = '100%'
    })
  }))

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
