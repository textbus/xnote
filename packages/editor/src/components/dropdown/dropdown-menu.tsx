import {
  createRef,
  inject,
  InjectionToken,
  onUnmounted,
  onUpdated, Portal,
  Props, Ref,
  withAnnotation,
  withMark
} from '@viewfly/core'
import { VIEW_CONTAINER } from '@textbus/platform-browser'

import css from './dropdown-menu.scoped.scss'
import { DropdownContextService } from './dropdown-context.service'
import { DropdownService } from './dropdown.service'

export interface DropdownMenuProps extends Props {
  abreast?: boolean
  triggerRef: Ref<HTMLDivElement | null>
  width?: string
  noTrigger?: boolean
  padding?: string
  toLeft?: boolean
}

export const DropdownMenuContainer = new InjectionToken<HTMLElement>('DropdownMenuContainer')

export const DropdownMenuPortal = withAnnotation({
  providers: [
    DropdownService
  ]
}, withMark(css, function DropdownMenuPortal(props: DropdownMenuProps) {
  const dropdownContextService = inject(DropdownContextService)
  const container = inject(DropdownMenuContainer, inject(VIEW_CONTAINER))

  const menuRef = createRef<HTMLDivElement>()

  let timer: any = null
  const delay = 10

  function update() {
    const menuElement = menuRef.value!
    menuElement.style.height = 'auto'
    const containerRect = container.getBoundingClientRect()
    if (props.abreast) {
      const btnEle = props.triggerRef.value!
      const screenHeight = document.documentElement.clientHeight
      const menuHeight = menuElement.scrollHeight
      const maxHeight = Math.min(screenHeight - 20, menuHeight)

      menuElement.style.height = maxHeight + 'px'
      const btnRect = btnEle.getBoundingClientRect()

      let offsetTop = Math.max(btnRect.top - maxHeight / 2, containerRect.top)
      if (offsetTop < 10) {
        offsetTop = 10
      } else if (offsetTop + maxHeight > screenHeight - 10) {
        offsetTop = screenHeight - 10 - maxHeight
      }
      menuElement.style.top = offsetTop - containerRect.top + 'px'

      const triggerRect = props.triggerRef.value!.getBoundingClientRect()
      const leftDistance = triggerRect.left
      const isToLeft = leftDistance >= menuElement.offsetWidth + 20
      if (isToLeft && props.toLeft) {
        menuElement.style.left = leftDistance - menuElement.offsetWidth - 20 - containerRect.left + 'px'
        timer = setTimeout(() => {
          menuElement.style.transform = 'translateX(10px)'
          menuElement.style.opacity = '1'
        }, delay)
      } else {
        menuElement.style.left = triggerRect.right + 20 - containerRect.left + 'px'
        timer = setTimeout(() => {
          menuElement.style.transform = 'translateX(-10px)'
          menuElement.style.opacity = '1'
        }, delay)
      }

    } else {
      const triggerRect = props.triggerRef.value!.getBoundingClientRect()
      const documentClientHeight = document.documentElement.clientHeight

      const bottomDistance = documentClientHeight - triggerRect.bottom
      const isToTop = bottomDistance < 200 && triggerRect.top > bottomDistance
      let left = triggerRect.left - containerRect.left
      const clientWidth = document.documentElement.clientWidth
      const menuWidth = menuElement.offsetWidth

      const maxLeft = clientWidth - menuWidth - 20
      left = Math.min(maxLeft, left)
      // left = Math.max(left, 20)
      menuElement.style.left = left + 'px'

      if (isToTop) {
        const maxHeight = Math.max(menuElement.scrollHeight, menuElement.offsetHeight)
        const height = Math.min(triggerRect.top - 20, maxHeight, 400)
        menuElement.style.height = height + 'px'
        menuElement.style.top = triggerRect.top - 20 - height - containerRect.top + 'px'

        timer = setTimeout(() => {
          menuElement.style.transform = 'translateY(10px)'
          menuElement.style.opacity = '1'
        }, delay)
      } else {
        menuElement.style.height = Math.min(bottomDistance - 20, menuElement.scrollHeight) + 'px'
        menuElement.style.top = triggerRect.bottom + 20 - containerRect.top + 'px'

        timer = setTimeout(() => {
          menuElement.style.transform = 'translateY(-10px)'
          menuElement.style.opacity = '1'
        }, delay)
      }
    }
  }

  onUpdated(() => {
    update()
  })

  onUnmounted(() => {
    clearTimeout(timer)
  })

  function onEnter() {
    if (props.noTrigger) {
      return
    }
    dropdownContextService.canHide = false
    dropdownContextService.open()
  }

  function onLeave() {
    if (props.noTrigger) {
      return
    }
    dropdownContextService.canHide = true
    dropdownContextService.hide()
  }

  function stopPropagation(ev: MouseEvent) {
    ev.stopPropagation()
  }

  return () => {
    return <Portal container={container}>
      <div onMouseenter={onEnter} onMousedown={stopPropagation} onMouseleave={onLeave} ref={menuRef} style={{
        width: props.width
      }} class="dropdown-menu">
        <div class="dropdown-menu-content" style={{
          padding: props.padding
        }}>
          {
            props.children
          }
        </div>
      </div>
    </Portal>
  }
}))
