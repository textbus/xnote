import { createSignal, inject, onUnmounted, reactive } from '@viewfly/core'
import { Selection } from '@textbus/core'
import { IconGlyph } from '@viewfly/ui-icons'
import { Button, ColorPicker, Dropdown, MenuItem, Picker, Space } from '@viewfly/ui-components'

import { RefreshService } from '../../../services/refresh.service'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { cellBackgroundAttr } from '../../../textbus/attributes/cell-background.attr'
import { isInTable } from './help'
import { useCommonState } from '../_common/common-state'
import { I18nService } from '../../../services/i18n.service'

export interface CellBackgroundToolProps {
  inMenu?: boolean
}

export function CellBackgroundTool(props: CellBackgroundToolProps) {
  const i18n = inject(I18nService)
  const refreshService = inject(RefreshService)
  const selection = inject(Selection)

  const viewModel = reactive({
    disabled: false,
  })
  const color = createSignal('')

  function setCurrentColor() {
    const c = color()
    const commonAncestorComponent = selection.commonAncestorComponent
    if (commonAncestorComponent instanceof TableComponent) {
      const slots = commonAncestorComponent.getSelectedNormalizedSlots()
      if (slots) {
        slots.map(i => {
          return i.cells.filter(t => t.visible).map(i => i.raw.slot)
        }).flat().forEach(slot => {
          if (c) {
            slot.setAttribute(cellBackgroundAttr, c, s => {
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
          if (c) {
            parentSlot.setAttribute(cellBackgroundAttr, c)
          } else {
            parentSlot.removeAttribute(cellBackgroundAttr)
          }
          return
        }
        parentSlot = parentSlot.parentSlot
      }
    }
  }

  function setColor(picker: Picker) {
    const rgba = picker.rgba
    const c = rgba ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})` : ''
    color.set(c)
    setCurrentColor()
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    viewModel.disabled = !isInTable(selection)
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()
  const defaultColors = [
    '#ef7373',
    '#ec9c6a',
    '#dccc64',
    '#96e3a3',
    '#a1e2e3',
    '#90a0e5',
    '#c596e0',
  ]

  return () => {
    const disabled = viewModel.disabled || commonState().readonly || commonState().inSourceCode
    if (props.inMenu) {
      return (
        <Dropdown disabled={disabled}
                  block={true}
                  orientation={'horizontal'}
                  horizontalAlign={'left'}
                  dropdown={
                    <ColorPicker recentColorsLabel={i18n.t('colorPicker.recentColorsLabel')}
                                 paletteTriggerLabel={i18n.t('colorPicker.paletteTriggerLabel')}
                                 confirmLabel={i18n.t('colorPicker.confirmLabel')}
                                 recentColorsName={'tableCellBackgroundColor'} recentColors={defaultColors} onSelected={setColor}/>
                  }
                  trigger={'hover'}>
          <MenuItem chevronRight={true}
                    density={'compact'}
                    disabled={disabled}
                    icon={<IconGlyph name={'palette'} style={{
                      color: disabled ? '' : color()
                    }}/>

                    }>
            {i18n.t('table.cellBackground')}
          </MenuItem>
        </Dropdown>
      )
    }
    return (
      <Space.Compact>
        <Button onClick={setCurrentColor}
                size={'small'}
                variant={'text'}
                inlineCompact={true}
                chevronGapless={true}
                style={{
                  paddingRight: '0px',
                }}
                disabled={disabled}>
          <IconGlyph name={'palette'} style={{
            color: disabled ? '' : color()
          }}/>
        </Button>
        <Dropdown disabled={disabled}
                  verticalPanelAlign={'right'}
                  dropdown={
                    <ColorPicker recentColorsLabel={i18n.t('colorPicker.recentColorsLabel')}
                                 paletteTriggerLabel={i18n.t('colorPicker.paletteTriggerLabel')}
                                 confirmLabel={i18n.t('colorPicker.confirmLabel')}
                                 recentColorsName={'tableCellBackgroundColor'} recentColors={defaultColors} onSelected={setColor}/>
                  }
                  trigger={'hover'}>
          <Button chevronDown={true}
                  inlineCompact={true}
                  chevronGapless={true}
                  style={{
                    paddingLeft: '0px',
                  }}
                  variant={'text'} size={'small'}></Button>
        </Dropdown>
      </Space.Compact>
    )
  }
}
