import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Selection } from '@textbus/core'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { RefreshService } from '../../../services/refresh.service'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { useCommonState } from '../_common/common-state'

export function SplitCellsTool() {
  const refreshService = inject(RefreshService)
  const selection = inject(Selection)

  const viewModel = reactive({
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
    if (commonAncestorComponent instanceof TableComponent) {
      const slots = commonAncestorComponent.getSelectedNormalizedSlots()
      if (slots) {
        for (const item of slots) {
          for (const cell of item.cells) {
            if (cell.visible && cell.colspan > 1 || cell.colspan > 1) {
              viewModel.disabled = false
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
                viewModel.disabled = !(cell.colspan > 1 || cell.colspan > 1)
                return
              }
            }
          }
        }
        parentSlot = parentSlot.parentSlot
      }
    }
    viewModel.disabled = true
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()
  return () => {
    return <Button highlight={viewModel.highlight}
                   size={'small'}
                   variant={'text'}
                   inlineCompact={true}
                   chevronGapless={true}
                   disabled={viewModel.disabled || commonState().readonly || commonState().inSourceCode}
                   onClick={split}>
      <IconGlyph name={'split-cells'}/>
    </Button>
  }
}
