import { withScopedCSS } from '@viewfly/scoped-css'
import { JSXNode, Props } from '@viewfly/core'

import css from './menu-item.scoped.scss'

export interface MenuItemProps extends Props {
  disabled?: boolean
  checked?: boolean
  icon?: JSXNode
  value?: any
  arrow?: boolean

  onClick?(value: any): void
}

export function MenuItem(props: MenuItemProps) {
  function click() {
    if (props.disabled) {
      return
    }
    props.onClick?.(props.value)
  }

  return withScopedCSS(css, () => {
    return (
      <div class={['menu-item', { disabled: props.disabled }]} onClick={click}>
        <div>{
          props.icon && <span class="menu-icon">{props.icon}</span>
        }{props.children}</div>
        {
          props.arrow ?
            <div class="arrow">
              <span class="xnote-icon-arrow-right"></span>
            </div> :
            <div class={[
              'menu-check',
              { checked: props.checked }
            ]}><span class="xnote-icon-checkmark"></span></div>
        }
      </div>
    )
  })
}
