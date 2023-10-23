import { getCurrentInstance, Injectable, JSXNode, onMounted, onUnmounted, Props, provide, Scope, useEffect, useSignal } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { delay, fromEvent, Subject, Subscription } from '@textbus/core'
import { useStaticRef } from '@viewfly/hooks'

import css from './dropdown.scoped.scss'

export type DropdownTriggerTypes = 'hover' | 'click'

export interface DropdownMenu {
  disabled?: boolean
  label: JSXNode
  value: any
}

export interface DropdownProps extends Props {
  trigger?: DropdownTriggerTypes
  menu: DropdownMenu[] | JSXNode

  onCheck?(value: any): void
}

@Injectable()
export class DropdownService {
  isOpen = false
  onOpenStateChange = new Subject<boolean>()

  constructor() {
    this.onOpenStateChange.subscribe(b => {
      this.isOpen = b
    })
  }
}

export function Dropdown(props: DropdownProps) {
  const isShow = useSignal(false)
  const toTop = useSignal(false)
  provide(DropdownService)

  const component = getCurrentInstance()
  const dropdownService = component.get(DropdownService)

  const toggle = () => {
    const next = !isShow()
    isShow.set(next)
  }

  const menuRef = useStaticRef<HTMLElement>()
  const triggerRef = useStaticRef<HTMLElement>()
  const dropdownRef = useStaticRef<HTMLElement>()

  function updateMenuHeight() {
    if (menuRef.current) {
      const triggerRect = triggerRef.current!.getBoundingClientRect()
      const documentClientHeight = document.documentElement.clientHeight

      const bottomDistance = documentClientHeight - triggerRect.bottom
      const isToTop = bottomDistance < 200 && triggerRect.top > bottomDistance
      toTop.set(isToTop)
      const maxHeight = Math.max(menuRef.current.scrollHeight, menuRef.current.offsetHeight)
      if (isToTop) {
        menuRef.current.style.maxHeight = Math.min(triggerRect.top - 30, maxHeight) + 'px'
      } else {
        menuRef.current.style.maxHeight = bottomDistance - 30 + 'px'
      }
    }
  }

  useEffect(isShow, (newValue) => {
    if (newValue && menuRef.current) {
      updateMenuHeight()
    }
    dropdownService.onOpenStateChange.next(newValue)
  })

  const subscription = new Subscription()
  onMounted(() => {
    if (props.trigger === 'click') {
      subscription.add(fromEvent(triggerRef.current!, 'click').subscribe(toggle))
      return
    }
    let leaveSub: Subscription
    const bindLeave = function () {
      leaveSub = fromEvent(dropdownRef.current!, 'mouseleave').pipe(delay(200)).subscribe(() => {
        isShow.set(false)
      })
    }
    bindLeave()
    subscription.add(
      fromEvent(dropdownRef.current!, 'mouseenter').subscribe(() => {
        if (leaveSub) {
          leaveSub.unsubscribe()
        }
        bindLeave()
        isShow.set(true)
      })
    )
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  return withScopedCSS(css, () => {
    return (
      <div class="dropdown" ref={dropdownRef}>
        <div class="dropdown-btn" ref={triggerRef}>
          <div class="dropdown-btn-inner">
            {props.children}
          </div>
          <div class="dropdown-btn-arrow"/>
        </div>
        <div ref={menuRef} class={['dropdown-menu', {
          active: isShow(),
          'to-top': toTop()
        }]}>
          {
            Array.isArray(props.menu) ?
              props.menu.map(menu => {
                return (
                  <div class="dropdown-menu-item" onClick={() => {
                    if (menu.disabled) {
                      return
                    }
                    props.onCheck?.(menu.value)
                  }}>{menu.label}</div>
                )
              }) :
              props.menu
          }
        </div>
      </div>
    )
  })
}

Dropdown.scope = new Scope('Dropdown')
