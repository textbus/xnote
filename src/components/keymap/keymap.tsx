import { Keymap } from '@textbus/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { ViewNode } from '@viewfly/core'
import { isMac } from '@textbus/platform-browser'

import css from './keymap.scoped.scss'

export interface KeymapProps {
  keymap: Keymap
}

export function Keymap(props: KeymapProps) {
  const arr: ViewNode[] = []
  const keymap = props.keymap
  if (keymap.ctrlKey) {
    arr.push(isMac() ? <span class="xnote-icon-command"></span> : 'Ctrl')
  }
  if (keymap.shiftKey) {
    if (arr.length) {
      arr.push('+')
    }
    arr.push(isMac() ? <span class="xnote-icon-shift"></span> : 'Shift')
  }
  if (keymap.altKey) {
    if (arr.length) {
      arr.push('+')
    }
    arr.push(isMac() ? <span class="xnote-icon-opt"></span> : 'Alt')
  }
  if (keymap.key) {
    if (arr.length) {
      arr.push('+')
    }
    if (Array.isArray(keymap.key)) {
      arr.push(<span>{keymap.key.join('/')}</span>)
    } else {
      arr.push(<span>{keymap.key}</span>)
    }
  }
  return withScopedCSS(css, () => {
    return (
      <span class="keymap">
        {
          arr
        }
      </span>
    )
  })
}
