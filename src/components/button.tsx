import { withScopedCSS } from '@viewfly/scoped-css'
import { ButtonHTMLAttributes } from '@viewfly/platform-browser'
import { Props } from '@viewfly/core'

import css from './button.scoped.scss'

export interface ButtonProps extends Props, ButtonHTMLAttributes<HTMLButtonElement> {
  highlight: boolean
}

export function Button(props: ButtonProps) {
  return withScopedCSS(css, () => {
    return (
      <button type="button" class="editor-btn" {...props}>{props.children}</button>
    )
  })
}
