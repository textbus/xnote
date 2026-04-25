import { StyleValue } from '@viewfly/platform-browser'
import { Props, withMark } from '@viewfly/core'

import css from './component-toolbar.scoped.scss'

export interface ComponentToolbarProps extends Props {
  visible?: boolean
  style?: StyleValue
  innerStyle?: StyleValue
}

export const ComponentToolbar = withMark(css, function ComponentToolbar(props: ComponentToolbarProps) {
  return () => {
    return (
      <div class="component-toolbar" style={props.style}>
        <div class={[
          'toolbar',
          {
            active: props.visible
          }
        ]} style={props.innerStyle}>
          {props.children}
        </div>
      </div>
    )
  }
})
