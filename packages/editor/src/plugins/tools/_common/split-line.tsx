import { withScopedCSS } from '@viewfly/scoped-css'

import css from './split-line.scoped.scss'

export function SplitLine() {
  return withScopedCSS(css, () => {
    return <div class="split-line"></div>
  })
}
