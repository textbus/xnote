import { Injectable } from '@viewfly/core'
import { CollaborateSelectionAwarenessDelegate, DomAdapter, UserSelectionCursor } from '@textbus/platform-browser'
import { AbstractSelection, Slot, Selection } from '@textbus/core'

import { TableComponent } from './table.component'
import { Rectangle } from './tools/merge'

export function findFocusCell(table: TableComponent, slot: Slot): Slot | null {
  while (slot) {
    if (table.slots.includes(slot)) {
      return slot
    }
    slot = slot.parent?.parent as Slot
  }
  return null
}


@Injectable()
export class TableSelectionAwarenessDelegate extends CollaborateSelectionAwarenessDelegate {
  constructor(private domAdapter: DomAdapter,
              private selection: Selection) {
    super()
  }

  override getRects(abstractSelection: AbstractSelection, _: any, data: UserSelectionCursor) {
    const { focusSlot, anchorSlot } = abstractSelection
    const focusPaths = this.selection.getPathsBySlot(focusSlot)!
    const anchorPaths = this.selection.getPathsBySlot(anchorSlot)!
    const focusIsStart = Selection.compareSelectionPaths(focusPaths, anchorPaths)
    let startSlot: Slot
    let endSlot: Slot
    if (focusIsStart) {
      startSlot = focusSlot
      endSlot = anchorSlot
    } else {
      startSlot = anchorSlot
      endSlot = focusSlot
    }
    const commonAncestorComponent = Selection.getCommonAncestorComponent(startSlot, endSlot)
    if (!(commonAncestorComponent instanceof TableComponent)) {
      return false
    }

    const rect: Rectangle = data.data || commonAncestorComponent.getMaxRectangle(
      findFocusCell(commonAncestorComponent, startSlot!)!,
      findFocusCell(commonAncestorComponent, endSlot!)!)

    if (!rect) {
      return false
    }
    const dom = this.domAdapter.getNativeNodeByComponent(commonAncestorComponent)!
    const content = dom.querySelector('.xnote-table-content')!
    const trs = content.querySelectorAll('tr')
    const cols = content.querySelectorAll('col')

    const top = trs[rect.y1].getBoundingClientRect().top
    const left = cols[rect.x1].getBoundingClientRect().left
    let height = trs[rect.y2 - 1].getBoundingClientRect().bottom - top
    if (height === 0) {
      height = trs[rect.y2 - 1].children.item(0)!.getBoundingClientRect().bottom - top
    }
    const width = cols[rect.x2 - 1].getBoundingClientRect().right - left
    return [{
      left,
      top,
      width,
      height
    }]
  }
}


