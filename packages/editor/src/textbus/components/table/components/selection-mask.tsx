import { inject, onMounted, onUnmounted, reactive, Ref, watch } from '@viewfly/core'
import { debounceTime } from '@textbus/core'

import './selection-mask.scss'
import { TableComponent } from '../table.component'
import { sum } from '../_utils'
import { isShowMask } from '../table.service'
import { EditorService } from '@textbus/xnote'

export interface TableSelection {
  startRow: number
  endRow: number
  startColumn: number
  endColumn: number
}

export interface SelectionMaskProps {
  component: TableComponent
  tableRef: Ref<HTMLTableElement | null>
}

export const SelectionMask = function SelectionMask(props: SelectionMaskProps) {
  const styles = reactive({
    visible: false,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 'auto',
    height: 'auto'
  })
  onMounted(() => {
    update()
  })

  const editorService = inject(EditorService)

  watch(props.component.tableSelection, update)

  function update() {
    const selection = props.component.tableSelection()!
    const state = props.component.state
    if (isShowMask(props.component)) {
      editorService.changeLeftToolbarVisible(false)
      let topCompensation = 0.5
      let heightCompensation = -1
      if (selection.startRow === 0) {
        topCompensation = 0
        heightCompensation = -0.5
      }
      if (selection.startRow > 0) {
        heightCompensation = -1
      }
      if (selection.endRow + 1 === state.rows.length) {
        heightCompensation += 0.5
      }
      const trs = Array.from(props.tableRef.value!.rows)

      const height = trs[selection.endRow - 1].offsetHeight ||
        (trs[selection.endRow - 1].children[0] as HTMLElement)?.offsetHeight || 0

      styles.visible = true
      styles.left = sum(state.columnsConfig.slice(0, selection.startColumn))
      styles.top = trs[selection.startRow].offsetTop + topCompensation
      styles.width = sum(state.columnsConfig.slice(selection.startColumn, selection.endColumn)) - 1 + 'px'
      styles.height = trs[selection.endRow - 1].offsetTop + height + heightCompensation - styles.top + 'px'
    } else {
      editorService.canShowLeftToolbar = true
      styles.visible = false
    }
  }

  const s = props.component.changeMarker.onChange.pipe(debounceTime(30)).subscribe(() => {
    update()
  })

  onUnmounted(() => {
    s.unsubscribe()
  })
  return () => {
    return (
      <div class={['xnote-table-selection-mask', {
        'xnote-table-selection-mask--active': styles.visible
      }]} style={{
        left: styles.left + 'px',
        top: styles.top + 'px',
        right: styles.right + 'px',
        width: styles.width,
        height: styles.height,
        bottom: styles.bottom + 'px'
      }}/>
    )
  }
}
