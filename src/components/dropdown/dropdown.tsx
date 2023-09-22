import { getCurrentInstance, Injectable, JSXNode, onMounted, onUnmounted, Props, provide, Scope, useSignal } from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'

import css from './dropdown.scoped.scss'
import { delay, fromEvent, merge, Subject, Subscription } from '@textbus/core'
import { useStaticRef } from '@viewfly/hooks'

export type DropdownTriggerTypes = 'hover' | 'click'

export interface DropdownMenu {
  label: JSXNode
  value: any
}

export interface DropdownProps extends Props {
  trigger?: DropdownTriggerTypes
  menu: DropdownMenu[]

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
  provide(DropdownService)

  const component = getCurrentInstance()
  const dropdownService = component.get(DropdownService)

  const toggle = () => {
    const next = !isShow()
    isShow.set(next)
    dropdownService.onOpenStateChange.next(next)
  }

  const menuRef = useStaticRef<HTMLElement>()
  const triggerRef = useStaticRef<HTMLElement>()

  const subscription = new Subscription()
  onMounted(() => {
    if (props.trigger === 'hover') {
      let leaveSub: Subscription
      const bindLeave = function () {
        leaveSub = merge(fromEvent(triggerRef.current!, 'mouseleave'), fromEvent(menuRef.current!, 'mouseleave')).pipe(delay(200)).subscribe(() => {
          isShow.set(false)
          dropdownService.onOpenStateChange.next(false)
        })
      }
      bindLeave()
      subscription.add(
        merge(fromEvent(triggerRef.current!, 'mouseenter'), fromEvent(menuRef.current!, 'mouseenter')).subscribe(() => {
          if (leaveSub) {
            leaveSub.unsubscribe()
          }
          bindLeave()
          isShow.set(true)
          dropdownService.onOpenStateChange.next(true)
        })
      )
    } else {
      subscription.add(fromEvent(triggerRef.current!, 'click').subscribe(toggle))
    }
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  return withScopedCSS(css, () => {
    return (
      <div class="dropdown">
        <div class="dropdown-btn" ref={triggerRef}>
          <div class="dropdown-btn-inner">
            {props.children}
          </div>
          <div class="dropdown-btn-arrow"/>
        </div>
        <div ref={menuRef} class={['dropdown-menu', {
          active: isShow()
        }]}>
          {
            props.menu.map(menu => {
              return (
                <div class="dropdown-menu-item" onClick={() => {
                  props.onCheck?.(menu.value)
                }}>{menu.label}</div>
              )
            })
          }
        </div>
      </div>
    )
  })
}

Dropdown.scope = new Scope('Dropdown')
