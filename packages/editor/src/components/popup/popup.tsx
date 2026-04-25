import { inject, Portal, Props, withMark } from '@viewfly/core'
import { VIEW_CONTAINER } from '@textbus/platform-browser'

import css from './popup.scoped.scss'

export interface PopupProps extends Props {
  left: number
  top: number
}

export const Popup = withMark(css, function Popup(props: PopupProps) {
  const host = inject(VIEW_CONTAINER)
  return () => {
    return <Portal host={host}>
      <div class="popup" style={{
        left: props.left + 'px',
        top: props.top + 'px'
      }}>
        {props.children}
      </div>
    </Portal>
  }
})
