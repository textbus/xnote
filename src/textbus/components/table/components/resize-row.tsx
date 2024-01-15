import { withScopedCSS } from '@viewfly/scoped-css'
import { createRef, inject, onMounted, StaticRef } from '@viewfly/core'
import { useProduce } from '@viewfly/hooks'

import css from './resize-row.scoped.scss'
import { TableService } from '../table.service'

export interface ResizeRowProps {
  tableRef: StaticRef<HTMLTableElement>
}

export function ResizeRow(props: ResizeRowProps) {
  const dragLineRef = createRef<HTMLDivElement>()
  const tableService = inject(TableService)
  const [styles, updateStyles] = useProduce({
    visible: false,
    top: 0
  })
  onMounted(() => {
    const sub = tableService.onInsertRowBefore.subscribe(i => {
      if (i === null) {
        updateStyles(draft => {
          draft.visible = false
        })
        return
      }
      updateStyles(draft => {
        draft.visible = true
        if (i === -1) {
          draft.top = 0
          return
        }
        const row = props.tableRef.current!.rows.item(i)!
        draft.top = row.offsetTop + row.offsetHeight
      })
    })
    return () => sub.unsubscribe()
  })
  return withScopedCSS(css, () => {
    return <div ref={dragLineRef}
                style={{
                  display: styles().visible ? 'block' : 'none',
                  top: styles().top + 'px'
                }}
                class={'drag-line'}/>
  })
}