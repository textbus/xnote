import { createSignal, inject, Props } from '@viewfly/core'
import { Commander, Slot } from '@textbus/core'
import { HTMLAttributes } from '@viewfly/platform-browser'

import { Button } from '../../components/button/button'
import { Dropdown, DropdownProps } from '../../components/dropdown/dropdown'
import { ColorPicker, Picker } from '../../components/color-picker/color-picker'
import { colorFormatter } from '../../textbus/formatters/color'
import { useCommonState } from './_common/common-state'

export interface TextColorToolProps extends Props {
  abreast?: DropdownProps['abreast']
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
      <Dropdown arrow={!props.children} width={'177px'}
                style={props.style}
                disabled={disabled}
                abreast={props.abreast}
                menu={
                  <ColorPicker recentColors={defaultColors} onSelected={setColor}/>
                }
                trigger={'hover'}>
        {
          props.children || <Button onClick={setCurrentColor}
                                    disabled={disabled}>
          <span style={{
            color: disabled ? '' : color()
          }} class="xnote-icon-color"></span>
          </Button>
        }
      </Dropdown>
    )
  }
}
