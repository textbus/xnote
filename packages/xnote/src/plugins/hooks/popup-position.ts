import { SelectionBridge, VIEW_CONTAINER } from '@textbus/platform-browser'
import { Selection } from '@textbus/core'
import { inject } from '@viewfly/core'

export function usePopupPosition() {
  const selectionBridge = inject(SelectionBridge)
  const container = inject(VIEW_CONTAINER)
  const selection = inject(Selection)

  return function (width: number, height: number) {
    const containerRect = container.getBoundingClientRect()
    const rect = selectionBridge.getRect({
      slot: selection.focusSlot!,
      offset: selection.focusOffset!
    }) || { left: 0, top: 0, width: 0, height: 0 }

    let left = rect.left - width / 2
    const right = left + width
    if (right > containerRect.right) {
      left = containerRect.right - width
    }
    if (left < containerRect.left) {
      left = containerRect.left
    }

    let top = rect.top - height - 10
    if (top < 10) {
      top = rect.top + rect.height + 10
    }

    return {
      left: left - containerRect.left,
      top: top - containerRect.top,
    }
  }
}
