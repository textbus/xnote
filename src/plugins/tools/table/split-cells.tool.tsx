import { useProduce } from '@viewfly/hooks'
import { inject, onUnmounted } from '@viewfly/core'
import { Selection } from '@textbus/core'

import { Button } from '../../../components/button/button'
import { RefreshService } from '../../../services/refresh.service'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { useCommonState } from '../_common/common-state'

export function SplitCellsTool() {
  const refreshService = inject(RefreshService)
  const selection = inject(Selection)

  const [viewModel, update] = useProduce({
    highlight: false,
    disabled: false,
  })

  function split() {
    const commonAncestorComponent = selection.commonAncestorComponent
    if (commonAncestorComponent instanceof TableComponent) {
      commonAncestorComponent.splitCellsBySelection()
      return
    }
    let parentSlot = selection.commonAncestorSlot

    while (parentSlot) {
      if (parentSlot.parent instanceof TableComponent) {
        if (parentSlot.parent === commonAncestorComponent) {
          parentSlot.parent.splitCellsBySelection()
          return
        }
        parentSlot.parent.splitCellBySlot(parentSlot)
        return
      }
      parentSlot = parentSlot.parentSlot
    }
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const commonAncestorComponent = selection.commonAncestorComponent
    update(draft => {
      if (commonAncestorComponent instanceof TableComponent) {
        const slots = commonAncestorComponent.getSelectedNormalizedSlots()
        if (slots) {
          for (const item of slots) {
            for (const cell of item.cells) {
              if (cell.visible && cell.colspan > 1 || cell.colspan > 1) {
                draft.disabled = false
                return
              }
            }
          }
        }
      } else {
        let parentSlot = selection.commonAncestorSlot

        while (parentSlot) {
          if (parentSlot.parent instanceof TableComponent) {
            const slots = parentSlot.parent.getNormalizedData()
            for (const item of slots) {
              for (const cell of item.cells) {
                if (cell.raw.slot === parentSlot) {
                  draft.disabled = !(cell.colspan > 1 || cell.colspan > 1)
                  return
                }
              }
            }
          }
          parentSlot = parentSlot.parentSlot
        }
      }
      draft.disabled = true
    })
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()
  return () => {
    const vm = viewModel()
    return <Button highlight={vm.highlight}
                   disabled={vm.disabled || commonState().readonly || commonState().inSourceCode}
                   onClick={split}>
      <span class="xnote-icon-split-cells"></span>
    </Button>
  }
}
