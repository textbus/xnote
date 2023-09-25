import { withScopedCSS } from '@viewfly/scoped-css'
import { JSXNode, Props } from '@viewfly/core'

import css from './menu-item.scoped.scss'

export interface MenuItemProps extends Props {
  checked?: boolean
  icon?: JSXNode
  value?: any
  onClick?(value: any): void
}

export function MenuItem(props: MenuItemProps) {
  function click() {
    props.onClick?.(props.value)
  }
  return withScopedCSS(css, () => {
    return (
      <div class="menu-item" onClick={click}>
        <div>{
          props.icon && <span class="menu-icon">{props.icon}</span>
        }{props.children}</div>
        <div class={[
          'menu-check',
          {checked: props.checked}
        ]}><span class="xnote-icon-checkmark"></span></div>
      </div>
    )
  })
}
