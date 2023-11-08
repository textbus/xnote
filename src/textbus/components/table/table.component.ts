import { ComponentInitData, ContentType, defineComponent, onFocusIn, onFocusOut, Slot, Subject } from '@textbus/core'
import { VIEW_CONTAINER } from '@textbus/platform-browser'

import { paragraphComponent } from '../paragraph/paragraph.component'

export interface TableComponentConfig {
  rowCount: number
  colCount: number
  layoutWidth: number[]
  layoutHeight: number[]
}

export interface TableCellConfig {
  rowspan: number
  colspan: number
}

export const tableComponent = defineComponent({
  name: 'TableComponent',
  type: ContentType.BlockComponent,
  validate(textbus, data?: ComponentInitData<TableComponentConfig, TableCellConfig>) {
    if (!data) {
      const colCount = 10
      const rowCount = 3
      const docContainer = textbus.get(VIEW_CONTAINER)
      const docWidth = docContainer.offsetWidth || 1200
      data = {
        slots: Array.from({ length: colCount * rowCount }).map(() => {
          const slot = new Slot<TableCellConfig>([ContentType.BlockComponent])
          const p = paragraphComponent.createInstance(textbus)
          slot.insert(p)
          return slot
        }),
        state: {
          colCount,
          rowCount,
          layoutHeight: Array.from<number>({ length: rowCount }).fill(30),
          layoutWidth: Array.from<number>({ length: colCount }).fill(docWidth / colCount)
        }
      }
    }
    return data
  },
  setup() {
    const focus = new Subject<boolean>()
    onFocusIn(() => {
      focus.next(true)
    })
    onFocusOut(() => {
      focus.next(false)
    })
    return {
      focus
    }
  }
})
