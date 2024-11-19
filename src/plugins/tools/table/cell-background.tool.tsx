import { useProduce } from '@viewfly/hooks'
import { inject, onUnmounted } from '@viewfly/core'
import { Selection } from '@textbus/core'

import { Button } from '../../../components/button/button'
import { RefreshService } from '../../../services/refresh.service'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { Dropdown } from '../../../components/dropdown/dropdown'
import { ColorPicker, Picker } from '../../../components/color-picker/color-picker'
import { cellBackgroundAttr } from '../../../textbus/attributes/cell-background.attr'
import { isInTable } from './help'

export function CellBackgroundTool() {
  const refreshService = inject(RefreshService)
  const selection = inject(Selection)

  const [viewModel, update] = useProduce({
    highlight: false,
    disabled: false,
  })

  function setColor(picker: Picker) {
    const commonAncestorComponent = selection.commonAncestorComponent
    if (commonAncestorComponent instanceof TableComponent) {
      const slots = commonAncestorComponent.getSelectedNormalizedSlots()
      if (slots) {
        slots.map(i => {
          return i.cells.filter(t => t.visible).map(i => i.raw.slot)
        }).flat().forEach(slot => {
          const rgba = picker.rgba
          if (rgba) {
            slot.setAttribute(cellBackgroundAttr, `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`, s => {
              return slot === s
            })
          } else {
            slot.removeAttribute(cellBackgroundAttr)
          }
        })
      }
    } else {
      let parentSlot = selection.commonAncestorSlot

      while (parentSlot) {
        if (parentSlot.parent instanceof TableComponent) {
          const rgba = picker.rgba
          if (rgba) {
            parentSlot.setAttribute(cellBackgroundAttr, `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`)
          } else {
            parentSlot.removeAttribute(cellBackgroundAttr)
          }
          return
        }
        parentSlot = parentSlot.parentSlot
      }
    }
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    update(draft => {
      draft.disabled = !isInTable(selection)
    })
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  return () => {
    const vm = viewModel()
    return (
      <Dropdown width={'177px'} menu={
        <ColorPicker onSelected={setColor}/>
      } trigger={'hover'}>
        <Button highlight={vm.highlight} disabled={vm.disabled}><span class="xnote-icon-palette"></span></Button>
      </Dropdown>
    )
  }
}
