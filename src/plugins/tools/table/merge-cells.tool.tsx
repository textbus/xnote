import { useProduce } from '@viewfly/hooks'
import { inject, onUnmounted } from '@viewfly/core'
import { Selection } from '@textbus/core'

import { Button } from '../../../components/button/button'
import { RefreshService } from '../../../services/refresh.service'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { getTableSlotBySlot, isInTable } from './help'

export function MergeCellsTool() {
  const refreshService = inject(RefreshService)
  const selection = inject(Selection)

  const [viewModel, update] = useProduce({
    highlight: false,
    disabled: false,
  })

  function merge() {
    const commonAncestorComponent = selection.commonAncestorComponent
    if (commonAncestorComponent instanceof TableComponent) {
      commonAncestorComponent.mergeCellBySelection()
    }
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    update(draft => {
      const is = isInTable(selection)
      if(is) {
        const p1 = getTableSlotBySlot(selection.startSlot)
        const p2 = getTableSlotBySlot(selection.endSlot)
        if (p1 && p2) {
          draft.disabled = p1 === p2
          return
        }
      }
      draft.disabled = true
    })
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  return () => {
    const vm = viewModel()
    return <Button highlight={vm.highlight} disabled={vm.disabled} onClick={merge}><span class="xnote-icon-merge-cells"></span></Button>
  }
}
