import { SelectionBridge } from '@textbus/platform-browser'
import { Selection } from '@textbus/core'
import { inject } from '@viewfly/core'

export function usePopupPosition() {
  const selectionBridge = inject(SelectionBridge)
  const selection = inject(Selection)

  return function () {
    return selectionBridge.getRect({
      slot: selection.focusSlot!,
      offset: selection.focusOffset!
    }) || { left: 0, top: 0, width: 0, height: 0 }
  }
}
