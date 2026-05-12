import { createRef, inject, onMounted, reactive, Ref } from '@viewfly/core'

import './resize-row.scss'
import { TableService } from '../table.service'
import { TableComponent } from '../table.component'
import { sum } from '../_utils'

export interface ResizeRowProps {
  tableRef: Ref<HTMLTableElement | null>
  component: TableComponent
}

export const ResizeRow = function ResizeRow(props: ResizeRowProps) {
  const dragLineRef = createRef<HTMLDivElement>()
  const tableService = inject(TableService)
  const styles = reactive({
    visible: false,
    top: 0
  })
  onMounted(() => {
    const sub = tableService.onInsertRowBefore.subscribe(i => {
      if (i === null) {
        styles.visible = false
        return
      }
      styles.visible = true
      if (i === -1) {
        styles.top = 0
        return
      }
      const row = props.tableRef.value!.rows.item(i)!
      styles.top = row.offsetTop + row.offsetHeight
    })
    return () => sub.unsubscribe()
  })
  return () => {
    return <div ref={dragLineRef}
                style={{
                  display: styles.visible ? 'block' : 'none',
                  top: styles.top + 'px',
                  width: sum(props.component.state.columnsConfig) + 'px'
                }}
                class={'xnote-table-row-resize-handle'}/>
  }
}
