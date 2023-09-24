import { withScopedCSS } from '@viewfly/scoped-css'
import { JSXNode, Props } from '@viewfly/core'

import css from './menu-item.scoped.scss'

export interface MenuItemProps extends Props {
  checked?: boolean
  icon?: JSXNode
}

export function MenuItem(props: MenuItemProps) {
  return withScopedCSS(css, () => {
    return (
      <div class="menu-item">
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
