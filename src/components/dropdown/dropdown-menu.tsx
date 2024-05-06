import { createRef, inject, onMounted, onUnmounted, Props, StaticRef } from '@viewfly/core'
import { createPortal } from '@viewfly/platform-browser'
import { withScopedCSS } from '@viewfly/scoped-css'

import css from './dropdown-menu.scoped.scss'
import { DropdownService } from './dropdown'

export interface DropdownMenuProps extends Props {
  abreast?: boolean
  triggerRef: StaticRef<HTMLElement>
}

export function DropdownMenuPortal(props: DropdownMenuProps) {
  const dropdownService = inject(DropdownService)

  const menuRef = createRef<HTMLElement>()

  let timer: any = null
  const delay = 200

  onMounted(() => {
    const menuElement = menuRef.current!
    if (props.abreast) {
      const triggerRect = props.triggerRef.current!.getBoundingClientRect()
      const leftDistance = triggerRect.left
      const isToLeft = leftDistance > menuElement.offsetWidth + 20
      if (isToLeft) {
        menuElement.style.right = '100%'
      } else {
        menuElement.style.left = '100%'
      }

      const btnEle = props.triggerRef.current!
      const screenHeight = document.documentElement.clientHeight
      const menuHeight = menuElement.scrollHeight
      const maxHeight = Math.min(screenHeight - 20, menuHeight)

      menuElement.style.height = maxHeight + 'px'
      const btnRect = btnEle.getBoundingClientRect()


      let offsetTop = maxHeight / 2
      if (btnRect.top - offsetTop < 10) {
        offsetTop = btnRect.top - 10
      } else if (btnRect.top + offsetTop > screenHeight - 10) {
        offsetTop += (btnRect.top + offsetTop - (screenHeight - 10))
      }
      menuElement.style.top = -offsetTop + 'px'
    } else {
      const triggerRect = props.triggerRef.current!.getBoundingClientRect()
      const documentClientHeight = document.documentElement.clientHeight

      const bottomDistance = documentClientHeight - triggerRect.bottom
      const isToTop = bottomDistance < 200 && triggerRect.top > bottomDistance
      menuElement.style.left = triggerRect.left + 'px'
      if (isToTop) {
        const maxHeight = Math.max(menuElement.scrollHeight, menuElement.offsetHeight)
        const height = Math.min(triggerRect.top - 20, maxHeight)
        menuElement.style.height = height + 'px'
        menuElement.style.top = triggerRect.top - 20 - height + 'px'

        timer = setTimeout(() => {
          menuElement.style.transform = 'translateY(10px)'
          menuElement.style.opacity = '1'
          dropdownService.onOpenStateChange.next(true)
        }, delay)
      } else {
        menuElement.style.height = Math.min(bottomDistance - 20, menuElement.scrollHeight) + 'px'
        menuElement.style.top = triggerRect.bottom + 20 + 'px'

        timer = setTimeout(() => {
          menuElement.style.transform = 'translateY(-10px)'
          menuElement.style.opacity = '1'
          dropdownService.onOpenStateChange.next(true)
        }, delay)
      }
    }
  })

  onUnmounted(() => {
    dropdownService.onOpenStateChange.next(false)
    clearTimeout(timer)
  })
  return createPortal(withScopedCSS(css, () => {
    return (
      <div ref={menuRef} style={{
        width: props.width
      }} class="dropdown-menu">
        <div class="dropdown-menu-content">
          {
            props.children
          }
        </div>
      </div>
    )
  }), document.body)
}
