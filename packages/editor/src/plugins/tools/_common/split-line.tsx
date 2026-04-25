import { withMark } from '@viewfly/core'

import css from './split-line.scoped.scss'

export const SplitLine = withMark(css, function SplitLine() {
  return () => {
    return <div class="split-line"></div>
  }
})
