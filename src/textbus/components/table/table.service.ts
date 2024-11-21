import { Injectable } from '@viewfly/core'
import { Subject } from '@textbus/core'

import { TableComponent } from './table.component'

@Injectable()
export class TableService {
  onInsertRowBefore = new Subject<number | null>()
  onInsertColumnBefore = new Subject<number | null>()
  // onSelectColumns = new Subject<{ start: number, end: number } | null>()
  // onSelectRows = new Subject<{ start: number, end: number } | null>()

  onScroll = new Subject<number>()
}

export function isShowMask(component: TableComponent) {
  const selection = component.tableSelection()
  const selectedSlots = component.getSelectedNormalizedSlots()
  const slotCount = selectedSlots ? selectedSlots.map(i => i.cells.filter(i => i.visible)).flat().length : 0
  return selection &&
    (selection.endColumn - selection.startColumn > 1 ||
      selection.endRow - selection.startRow > 1 ||
      slotCount > 1)
}
