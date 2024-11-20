import { inject, onUnmounted, createSignal } from '@viewfly/core'
import { Query, QueryStateType, Selection } from '@textbus/core'

import { Dropdown } from '../../../components/dropdown/dropdown'
import { Button } from '../../../components/button/button'
import { MenuItem } from '../../../components/menu-item/menu-item'
import { RefreshService } from '../../../services/refresh.service'
import { cellAlignAttr } from '../../../textbus/attributes/cell-align.attr'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { isInTable } from './help'
import { useCommonState } from '../_common/common-state'

export function CellAlignTool() {
  const currentValue = createSignal('')

  const selection = inject(Selection)

  function check(v: string) {
    const commonAncestorComponent = selection.commonAncestorComponent
    if (commonAncestorComponent instanceof TableComponent) {
      const slots = commonAncestorComponent.getSelectedNormalizedSlots()!

      slots.forEach(item => {
        item.cells.forEach(cell => {
          if (cell.visible) {
            cell.raw.slot.setAttribute(cellAlignAttr, v)
          }
        })
      })
    } else {
      const is = isInTable(selection)
      if (is) {
        let parentSlot = selection.commonAncestorSlot

        while (parentSlot) {
          if (parentSlot.parent instanceof TableComponent) {
            const slots = parentSlot.parent.getNormalizedData()
            for (const item of slots) {
              for (const cell of item.cells) {
                if (cell.visible && cell.raw.slot === parentSlot) {
                  cell.raw.slot.setAttribute(cellAlignAttr, v)
                  return
                }
              }
            }
          }
          parentSlot = parentSlot.parentSlot
        }
      }
    }
  }

  const refreshService = inject(RefreshService)
  const query = inject(Query)

  const highlight = createSignal(false)

  const subscription = refreshService.onRefresh.subscribe(() => {
    if (!isInTable(selection)) {
      highlight.set(false)
      currentValue.set('middle')
      return
    }
    const result = query.queryAttribute(cellAlignAttr)
    const isHighlight = result.state === QueryStateType.Enabled
    highlight.set(isHighlight)
    currentValue.set(isHighlight ? result.value! : 'middle')
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })


  const commonState = useCommonState()
  return () => {
    return (
      <Dropdown disabled={commonState().readonly || commonState().inSourceCode} onCheck={check} menu={[
        {
          label: <MenuItem checked={currentValue() === 'top'} icon={<span class="xnote-icon-align-top"></span>}>顶部对齐</MenuItem>,
          value: 'top'
        },
        {
          label: <MenuItem checked={currentValue() === 'middle'} icon={<span class="xnote-icon-align-middle"></span>}>垂直居中</MenuItem>,
          value: 'middle'
        },
        {
          label: <MenuItem checked={currentValue() === 'bottom'} icon={<span class="xnote-icon-align-bottom"></span>}>底部对齐</MenuItem>,
          value: 'bottom'
        }
      ]}>
        <Button arrow={true}
                disabled={commonState().readonly || commonState().inSourceCode}
                highlight={highlight()}>
          <span class={'xnote-icon-align-' + (currentValue() || 'middle')}></span>
        </Button>
      </Dropdown>
    )
  }
}
