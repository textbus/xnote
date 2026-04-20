import { createSignal, inject, Props } from '@viewfly/core'
import { Commander, Slot } from '@textbus/core'
import { HTMLAttributes } from '@viewfly/platform-browser'

import { Button } from '../../components/button/button'
import { Dropdown, DropdownProps } from '../../components/dropdown/dropdown'
import { ColorPicker, Picker } from '../../components/color-picker/color-picker'
import { backgroundColorFormatter } from '../../textbus/formatters/background-color'
import { useCommonState } from './_common/common-state'

export interface TextBackgroundColorToolProps extends Props {
  abreast?: DropdownProps['abreast']
  style?: HTMLAttributes<HTMLElement>['style']
  slot?: Slot | null

  applyBefore?(): void
}

export function TextBackgroundColorTool(props: TextBackgroundColorToolProps) {
  const commander = inject(Commander)

  const color = createSignal('')

  function setColor(picker: Picker) {
    props.applyBefore?.()
    const rgba = picker.rgba
    if (rgba) {
      const c = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
      commander.applyFormat(backgroundColorFormatter, c)
      color.set(c)
    } else {
      commander.unApplyFormat(backgroundColorFormatter)
      color.set('')
    }
  }

  function setCurrentColor() {
    if (props.slot) {
      return
    }
    const c = color()
    if (c) {
      commander.applyFormat(backgroundColorFormatter, c)
    } else {
      commander.unApplyFormat(backgroundColorFormatter)
    }
  }

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
    const disabled = commonState().readonly || commonState().inSourceCode || commonState().selectEmbed
    return (
      <Dropdown width={'177px'}
                disabled={disabled}
                arrow={!props.children}
                abreast={props.abreast}
                style={props.style}
                menu={
                  <ColorPicker recentColors={defaultColors} onSelected={setColor}/>
                }
                trigger={'hover'}>
        {props.children || <Button onClick={setCurrentColor} disabled={disabled}>
          <span style={{
            color: disabled ? '' : color()
          }} class="xnote-icon-background-color"></span>
        </Button>}
      </Dropdown>
    )
  }
}
