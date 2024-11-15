import { Selection, Slot } from '@textbus/core'

import { TableComponent } from '../../../textbus/components/table/table.component'

export function isInTable(selection: Selection) {
  if (selection.commonAncestorComponent instanceof TableComponent) {
    return true
  }

  if (selection.isCollapsed) {
    let slot = selection.commonAncestorSlot
    while (slot) {
      if (slot.parent instanceof TableComponent) {
        return true
      }
      slot = slot.parentSlot
    }
    return false
  }

  const startTable = getParentTable(selection.startSlot)
  const endTable = getParentTable(selection.endSlot)
  if (startTable && endTable) {
    return startTable === endTable
  }
  return false
}

export function getParentTable(slot: Slot | null): TableComponent | null {
  while (slot) {
    if (slot.parent instanceof TableComponent) {
      return slot.parent
    }
    slot = slot.parentSlot
  }
  return null
}

export function getTableSlotBySlot(slot: Slot | null): Slot | null {
  while (slot) {
    if (slot.parent instanceof TableComponent) {
      return slot
    }
    slot = slot.parentSlot
  }
  return null
}
