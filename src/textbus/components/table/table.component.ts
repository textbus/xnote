import {
  ComponentInitData,
  ContentType,
  defineComponent,
  onFocusIn,
  onFocusOut,
  onSlotRemove, Selection,
  Slot,
  Subject, useContext, useSelf
} from '@textbus/core'
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
    const textbus = useContext()
    const self = useSelf()
    const slots = self.slots
    onSlotRemove(ev => {
      ev.preventDefault()
    })
    onFocusIn(() => {
      focus.next(true)
    })
    onFocusOut(() => {
      focus.next(false)
    })

    const selection = useContext(Selection)
    return {
      focus,
      afterContentCheck() {
        slots.toArray().forEach(slot => {
          if (slot.isEmpty) {
            const p = paragraphComponent.createInstance(textbus)
            slot.insert(p)
            const childSlot = p.slots.first
            if (slot === selection.anchorSlot) {
              selection.setAnchor(childSlot, 0)
            }
            if (slot === selection.focusSlot) {
              selection.setFocus(childSlot, 0)
            }
          }
        })
      }
    }
  }
})
