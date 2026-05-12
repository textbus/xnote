import { inject, onUnmounted, createSignal } from '@viewfly/core'
import { Query, QueryStateType, Selection } from '@textbus/core'
import { Button, Dropdown, MenuItem, MenuList } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { RefreshService } from '../../../services/refresh.service'
import { cellAlignAttr } from '../../../textbus/attributes/cell-align.attr'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { isInTable } from './help'
import { useCommonState } from '../_common/common-state'
import { I18nService } from '../../../services/i18n.service'

export function CellAlignTool() {
  const i18n = inject(I18nService)
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
      <Dropdown disabled={commonState().readonly || commonState().inSourceCode}
                trigger={'hover'}
                verticalPanelAlign={'right'}
                dropdown={
                  <MenuList columnCompact={true} class="xnote-w-menu-40">
                    <MenuItem density={'compact'} onClick={() => check('top')} icon={<IconGlyph name={'align-top'}/>}>
                      <div class="xnote-flex-between">
                        {i18n.t('cellAlign.top')}
                        <span class="xnote-flex-center">
                {currentValue() === 'top' && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
                      </div>
                    </MenuItem>
                    <MenuItem density={'compact'} onClick={() => check('middle')} icon={<IconGlyph name={'align-middle'}/>}>
                      <div class="xnote-flex-between">
                        {i18n.t('cellAlign.middle')}
                        <span class="xnote-flex-center">
                {currentValue() === 'middle' && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
                      </div>
                    </MenuItem>
                    <MenuItem density={'compact'} onClick={() => check('bottom')} icon={<IconGlyph name={'align-bottom'}/>}>
                      <div class="xnote-flex-between">
                        {i18n.t('cellAlign.bottom')}
                        <span class="xnote-flex-center">
                {currentValue() === 'bottom' && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
                      </div>
                    </MenuItem>
                  </MenuList>
                }>
        <Button size={'small'}
                variant={'text'}
                inlineCompact={true}
                chevronGapless={true}
                disabled={commonState().readonly || commonState().inSourceCode}
                highlighted={highlight()}>
          <IconGlyph name={'align-' + (currentValue() || 'middle') as any}/>
        </Button>
      </Dropdown>
    )
  }
}
