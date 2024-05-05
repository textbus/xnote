import {
  createDynamicRef,
  createRef,
  createSignal,
  getCurrentInstance, inject,
  Injectable,
  JSXNode,
  onMounted,
  onUnmounted,
  Props,
  provide,
  Scope,
  watch,
} from '@viewfly/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { delay, fromEvent, Subject, Subscription, tap } from '@textbus/core'

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
  width?: string

  onCheck?(value: any): void
}

@Injectable({
  provideIn: 'root'
})
export class DropdownNotifyService {
  onOpen = new Subject<number>()
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
  const isShow = createSignal(false)
  const toTop = createSignal(false)
  const expand = createSignal(false)
  provide(DropdownService)

  const component = getCurrentInstance()
  const dropdownService = component.get(DropdownService)
  const dropdownNotifyService = inject(DropdownNotifyService)
  const id = Math.random()

  const toggle = () => {
    const next = !isShow()
    isShow.set(next)
  }

  let menuElement: HTMLElement | null = null

  const menuRef = createDynamicRef<HTMLElement>(el => {
    menuElement = el
    return () => {
      menuElement = null
    }
  })
  const triggerRef = createRef<HTMLElement>()
  const dropdownRef = createRef<HTMLElement>()

  function updateMenuHeight() {
    if (menuElement) {
      menuElement.scrollTo({
        top: 0
      })
      const triggerRect = triggerRef.current!.getBoundingClientRect()
      const documentClientHeight = document.documentElement.clientHeight

      const bottomDistance = documentClientHeight - triggerRect.bottom
      const isToTop = bottomDistance < 200 && triggerRect.top > bottomDistance
      toTop.set(isToTop)
      if (isToTop) {
        const maxHeight = Math.max(menuElement.scrollHeight, menuElement.offsetHeight)
        menuElement.style.height = Math.min(triggerRect.top - 30, maxHeight) + 'px'
      } else {
        menuElement.style.height = Math.min(bottomDistance - 30, menuElement.scrollHeight) + 'px'
      }
    }
  }

  watch(isShow, (newValue) => {
    if (newValue) {
      dropdownNotifyService.onOpen.next(id)
    }
  })

  watch(expand, newValue => {
    if (newValue && menuElement) {
      updateMenuHeight()
    }
    dropdownService.onOpenStateChange.next(newValue)
  })

  onMounted(() => {
    const sub = dropdownNotifyService.onOpen.subscribe(dropdownId => {
      if (dropdownId === id) {
        return
      }
      if (isShow()) {
        isShow.set(false)
      }
    })

    return () => sub.unsubscribe()
  })

  const subscription = new Subscription()
  onMounted(() => {
    if (props.trigger === 'click') {
      subscription.add(fromEvent(triggerRef.current!, 'click').subscribe(toggle))
      return
    }
    let leaveSub: Subscription
    const bindLeave = function () {
      leaveSub = fromEvent(dropdownRef.current!, 'mouseleave').pipe(
        delay(200)
      ).subscribe(() => {
        isShow.set(false)
        expand.set(false)
      })
    }
    bindLeave()
    subscription.add(
      fromEvent(dropdownRef.current!, 'mouseenter').pipe(
        tap(() => {
          if (leaveSub) {
            leaveSub.unsubscribe()
          }
          bindLeave()
          isShow.set(true)
        }),
        delay(100)
      ).subscribe(() => {
        expand.set(true)
      })
    )
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  return {
    isShow,
    $render: withScopedCSS(css, () => {
      return (
        <div class="dropdown" ref={dropdownRef}>
          <div class="dropdown-btn" ref={triggerRef}>
            <div class="dropdown-btn-inner">
              {props.children}
            </div>
            <div class="dropdown-btn-arrow"/>
          </div>
          {
            isShow() && <div ref={menuRef} style={{
              width: props.width
            }} class={['dropdown-menu', {
              'to-top': toTop(),
              'expand': expand()
            }]}>
              <div class="dropdown-menu-content">
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
          }
        </div>
      )
    })
  }
}

Dropdown.scope = new Scope('Dropdown')
