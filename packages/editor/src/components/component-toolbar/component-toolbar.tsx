import { StyleValue } from '@viewfly/platform-browser'
import { Props } from '@viewfly/core'

import './component-toolbar.scss'

export interface ComponentToolbarProps extends Props {
  visible?: boolean
  style?: StyleValue
  innerStyle?: StyleValue
}

export function ComponentToolbar(props: ComponentToolbarProps) {
  return () => {
    return (
      <div class="xnote-component-toolbar-host" style={props.style}>
        <div class={[
          'xnote-component-toolbar-panel',
          {
            'xnote-component-toolbar-panel--active': props.visible
          }
        ]} style={props.innerStyle}>
          {props.children}
        </div>
      </div>
    )
  }
}
