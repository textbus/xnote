import { Keymap as TextbusKeymap } from '@textbus/core'
import { JSXNode } from '@viewfly/core'
import { isMac } from '@textbus/platform-browser'

import './keymap.scss'
import { IconGlyph } from '@viewfly/ui-icons'

export interface KeymapProps {
  keymap: TextbusKeymap
}

export function Keymap(props: KeymapProps) {
  const arr: JSXNode[] = []
  const keymap = props.keymap
  if (keymap.modKey) {
    arr.push(isMac() ? <IconGlyph name={'command'}/> : <span>Ctrl</span>)
  }
  if (keymap.shiftKey) {
    if (arr.length) {
      arr.push('+')
    }
    arr.push(isMac() ? <IconGlyph name={'shift'}/> : <span>Shift</span>)
  }
  if (keymap.altKey) {
    if (arr.length) {
      arr.push('+')
    }
    arr.push(isMac() ? <IconGlyph name={'opt'}/> : <span>Alt</span>)
  }
  if (keymap.key) {
    if (arr.length) {
      arr.push('+')
    }
    if (Array.isArray(keymap.key)) {
      arr.push(<span>{keymap.key.join('/')}</span>)
    } else if (typeof keymap.key === 'object') {
      arr.push(<span>{keymap.key.name}</span>)
    } else {
      arr.push(<span>{keymap.key}</span>)
    }
  }
  return () => {
    return (
      <span class="xnote-keymap">
        {
          arr
        }
      </span>
    )
  }
}
