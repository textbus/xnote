import { withScopedCSS } from '@viewfly/scoped-css'
import { Props } from '@viewfly/core'

import css from './menu-item.scoped.scss'

export function MenuItem(props: Props) {
  return withScopedCSS(css, () => {
    return (
      <div class="menu-item">{props.children}</div>
    )
  })
}
