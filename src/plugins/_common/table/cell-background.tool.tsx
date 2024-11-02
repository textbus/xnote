import { useProduce } from '@viewfly/hooks'
import { inject, onUnmounted } from '@viewfly/core'
import { Selection } from '@textbus/core'

import { Button } from '../../../components/button/button'
import { RefreshService } from '../../../services/refresh.service'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { Dropdown } from '../../../components/dropdown/dropdown'
import { ColorPicker, Picker } from '../../../components/color-picker/color-picker'
import { cellBackgroundAttr } from '../../../textbus/attributes/cell-background.attr'

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
            slot.setAttribute(cellBackgroundAttr, `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`)
          } else {
            slot.removeAttribute(cellBackgroundAttr)
          }
        })
      }
    }
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const commonAncestorComponent = selection.commonAncestorComponent
    update(draft => {
      draft.disabled = !(commonAncestorComponent instanceof TableComponent)
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
