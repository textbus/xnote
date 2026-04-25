import { Props, withMark } from '@viewfly/core'

import css from './toolbar-item.scoped.scss'

export const ToolbarItem = withMark(css, function ToolbarItem(props: Props) {
  return () => {
    return (
      <div class="toolbar-item">
        {props.children}
      </div>
    )
  }
})
