import { withMark } from '@viewfly/core'

import css from './divider.scoped.scss'

export const Divider = withMark(css, function Divider() {
  return () => {
    return <div class="divider"/>
  }
})
