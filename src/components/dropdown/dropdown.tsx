import {
  createRef,
  createSignal,
  inject,
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
import { delay, fromEvent, Subject, Subscription } from '@textbus/core'
import { HTMLAttributes } from '@viewfly/platform-browser'

import css from './dropdown.scoped.scss'
import { DropdownMenuPortal } from './dropdown-menu'

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
  class?: HTMLAttributes<HTMLElement>['class']
  style?: HTMLAttributes<HTMLElement>['style']
  abreast?: boolean

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
  provide(DropdownService)

  const dropdownNotifyService = inject(DropdownNotifyService)
  const id = Math.random()

  const toggle = () => {
    const next = !isShow()
    isShow.set(next)
  }

  const triggerRef = createRef<HTMLElement>()
  const dropdownRef = createRef<HTMLElement>()

  watch(isShow, (newValue) => {
    if (newValue) {
      dropdownNotifyService.onOpen.next(id)
    }
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
        if (isEnterMenu) {
          return
        }
        isShow.set(false)
      })
    }
    bindLeave()
    subscription.add(
      fromEvent(dropdownRef.current!, 'mouseenter').subscribe(() => {
        clearTimeout(timer)
        if (leaveSub) {
          leaveSub.unsubscribe()
        }
        bindLeave()
        isShow.set(true)
      })
    )
  })
  let isEnterMenu = false
  let timer: any = null

  function onEnterMenu() {
    isEnterMenu = true
    clearTimeout(timer)
  }

  function onLeaveMenu() {
    isEnterMenu = false

    timer = setTimeout(() => {
      isShow.set(false)
    }, 200)
  }

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  return {
    isShow,
    $render: withScopedCSS(css, () => {
      return (
        <div class={['dropdown', props.class]} style={props.style} ref={dropdownRef}>
          <div class="dropdown-btn" ref={triggerRef}>
            <div class="dropdown-btn-inner">
              {props.children}
            </div>
            <div class="dropdown-btn-arrow"/>
          </div>
          {
            isShow() && <DropdownMenuPortal onEnter={onEnterMenu} onLeave={onLeaveMenu} abreast={props.abreast} triggerRef={triggerRef}>
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
            </DropdownMenuPortal>
          }
        </div>
      )
    })
  }
}

Dropdown.scope = new Scope('Dropdown')
