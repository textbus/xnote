import { inject, Portal, Props } from '@viewfly/core'
import { VIEW_CONTAINER } from '@textbus/platform-browser'

import './popup.scss'

export interface PopupProps extends Props {
  left: number
  top: number
}

export function Popup(props: PopupProps) {
  const host = inject(VIEW_CONTAINER)
  return () => {
    return <Portal container={host}>
      <div class="xnote-popup" style={{
        left: props.left + 'px',
        top: props.top + 'px'
      }}>
        {props.children}
      </div>
    </Portal>
  }
}
