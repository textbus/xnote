import { inject, onUnmounted, createSignal } from '@viewfly/core'
import { Query, QueryStateType, Selection } from '@textbus/core'
import { Button, Dropdown, MenuItem, MenuList } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

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
    const v = [
      {
        label: <MenuItem checked={currentValue() === 'top'} icon={<span class="xnote-icon-align-top"></span>}>顶部对齐</MenuItem>,
        value: 'top'
      },
      {
        label: <MenuItem checked={currentValue() === 'middle'} icon={<span class="xnote-icon-align-middle"></span>}>垂直居中</MenuItem>,
        value: 'middle'
      },
    ]
    return (
      <Dropdown disabled={commonState().readonly || commonState().inSourceCode}
                trigger={'hover'}
                verticalPanelAlign={'right'}
                dropdown={
                  <MenuList columnCompact={true} class={'w-40'}>
                    <MenuItem density={'compact'} onClick={() => check('top')} icon={<IconGlyph name={'align-top'}/>}>
                      <div class={'flex justify-between'}>
                        顶部对齐
                        <span class={'flex items-center'}>
                {currentValue() === 'top' && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
                      </div>
                    </MenuItem>
                    <MenuItem density={'compact'} onClick={() => check('middle')} icon={<IconGlyph name={'align-middle'}/>}>
                      <div class={'flex justify-between'}>
                        垂直居中
                        <span class={'flex items-center'}>
                {currentValue() === 'middle' && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
                      </div>
                    </MenuItem>
                    <MenuItem density={'compact'} onClick={() => check('highlightBox')} icon={<IconGlyph name={'align-bottom'}/>}>
                      <div class={'flex justify-between'}>
                        底部对齐
                        <span class={'flex items-center'}>
                {currentValue() === 'bottom' && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
                      </div>
                    </MenuItem>
                  </MenuList>
                }>
        <Button arrow={true}
                size={'small'}
                variant={'text'}
                inlineCompact={true}
                chevronGapless={true}
                disabled={commonState().readonly || commonState().inSourceCode}
                highlight={highlight()}>
          <IconGlyph name={'align-' + (currentValue() || 'middle') as any}/>
        </Button>
      </Dropdown>
    )
  }
}
