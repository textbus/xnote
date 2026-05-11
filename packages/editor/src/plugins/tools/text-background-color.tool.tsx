import { createSignal, inject, Props } from '@viewfly/core'
import { Commander, Slot } from '@textbus/core'
import { HTMLAttributes } from '@viewfly/platform-browser'
import { Button, ColorPicker, Dropdown, Picker, Space } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { backgroundColorFormatter } from '../../textbus/formatters/background-color'
import { useCommonState } from './_common/common-state'

export interface TextBackgroundColorToolProps extends Props {
  inLeftTool?: boolean
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
    if (props.inLeftTool) {
      return (
        <Dropdown disabled={disabled}
                  block={true}
                  orientation={props.inLeftTool ? 'horizontal' : 'vertical'}
                  dropdown={
                    <ColorPicker recentColors={defaultColors} onSelected={setColor}/>
                  }
                  trigger={'hover'}>
          {props.children}
        </Dropdown>
      )
    }
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
            <IconGlyph name={'background-color'} style={{
              color: disabled ? '' : color()
            }}/>
          </Button>
        }
        <Dropdown disabled={disabled}
                  verticalPanelAlign={'right'}
                  dropdown={
                    <ColorPicker recentColorsName={'textBackgroundColor'} recentColors={defaultColors} onSelected={setColor}/>
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
