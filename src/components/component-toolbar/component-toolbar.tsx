import { withScopedCSS } from '@viewfly/scoped-css'
import { Props } from '@viewfly/core'

import css from './component-toolbar.scoped.scss'

export interface ComponentToolbarProps extends Props {
  visible?: boolean
}
export function ComponentToolbar(props: ComponentToolbarProps) {
  return withScopedCSS(css, () => {
    return (
      <div class="component-toolbar">
        <div class={[
          'toolbar',
          {
            active: props.visible
          }
        ]}>
          {props.children}
        </div>
      </div>
    )
  })
}
