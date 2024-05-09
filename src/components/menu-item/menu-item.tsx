import { withScopedCSS } from '@viewfly/scoped-css'
import { createSignal, inject, InjectFlags, JSXNode, onUnmounted, Props } from '@viewfly/core'

import css from './menu-item.scoped.scss'
import { DropdownContextService } from '../dropdown/dropdown-context.service'

export interface MenuItemProps extends Props {
  disabled?: boolean
  checked?: boolean
  icon?: JSXNode
  value?: any
  arrow?: boolean

  onClick?(value: any): void
}

export function MenuItem(props: MenuItemProps) {
  const dropdownContextService = inject(DropdownContextService, InjectFlags.Optional, null)
  const isActive = createSignal(dropdownContextService?.isOpen || false)
  if (dropdownContextService) {
    const subscription = dropdownContextService.onOpenStateChange.subscribe(b => {
      isActive.set(b)
    })

    onUnmounted(() => {
      subscription.unsubscribe()
    })
  }

  function click() {
    if (props.disabled) {
      return
    }
    props.onClick?.(props.value)
  }

  return withScopedCSS(css, () => {
    return (
      <div class={['menu-item', { disabled: props.disabled, active: props.arrow && isActive() }]} onClick={click}>
        <div>{
          props.icon && <span class="menu-icon">{props.icon}</span>
        }{props.children}</div>
        {
          props.arrow ?
            <div class="arrow">
              <span class="xnote-icon-arrow-right"></span>
            </div> :
            <div class={[
              'menu-check',
              { checked: props.checked }
            ]}><span class="xnote-icon-checkmark"></span></div>
        }
      </div>
    )
  })
}
