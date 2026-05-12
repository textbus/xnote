import { Props } from '@viewfly/core'

import './menu-heading.scss'

export function MenuHeading(props: Props) {
  return () => {
    return (
      <div class="xnote-menu-heading">
        {props.children}
      </div>
    )
  }
}
