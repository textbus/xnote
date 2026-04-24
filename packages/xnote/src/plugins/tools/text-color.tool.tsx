import { createSignal, inject, Props } from '@viewfly/core'
import { Commander, Slot } from '@textbus/core'
import { HTMLAttributes } from '@viewfly/platform-browser'
import { Button, ColorPicker, Dropdown, Picker, Space } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { colorFormatter } from '../../textbus/formatters/color'
import { useCommonState } from './_common/common-state'

export interface TextColorToolProps extends Props {
  style?: HTMLAttributes<HTMLElement>['style']
  slot?: Slot | null

  applyBefore?(): void
}

export function TextColorTool(props: TextColorToolProps) {
  const commander = inject(Commander)

  const color = createSignal('#ff0000')

  function setColor(picker: Picker) {
    props.applyBefore?.()
    const rgba = picker.rgba
    if (rgba) {
      const c = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
      commander.applyFormat(colorFormatter, c)
      color.set(c)
    } else {
      commander.unApplyFormat(colorFormatter)
      color.set('')
    }
  }

  function setCurrentColor() {
    if (props.slot) {
      return
    }
    const c = color()
    if (c) {
      commander.applyFormat(colorFormatter, c)
    } else {
      commander.unApplyFormat(colorFormatter)
    }
  }

  const commonState = useCommonState()
  const defaultColors = [
    '#ff8d45',
    '#ffdf14',
    '#5eec75',
    '#5dfaff',
    '#1296db',
    '#617fff',
    '#c459ff',
  ]
  return () => {
    const disabled = commonState().readonly || commonState().inSourceCode || commonState().selectEmbed
    return (
      <Space.Compact>
        {
          props.children ||
          <Button onClick={setCurrentColor}
                  size={'small'}
                  variant={'text'}
                  inlineCompact={true}
                  chevronGapless={true}
                  style={{
                    paddingRight: '0px',
                  }}
                  disabled={disabled}>
            <IconGlyph name={'color'} style={{
              color: disabled ? '' : color()
            }}/>
          </Button>
        }
        <Dropdown disabled={disabled}
                  verticalPanelAlign={'right'}
                  dropdown={
                    <ColorPicker recentColors={defaultColors} onSelected={setColor}/>
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
