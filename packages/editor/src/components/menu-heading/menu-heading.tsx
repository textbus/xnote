import { Props, withMark } from '@viewfly/core'

import css from './menu-heading.scoped.scss'

export const MenuHeading = withMark(css, function (props: Props) {
  return () => {
    return (
      <div class="menu-heading">
        {props.children}
      </div>
    )
  }
})
