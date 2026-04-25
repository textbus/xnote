import { ButtonHTMLAttributes } from '@viewfly/platform-browser'
import { createSignal, inject, onUnmounted, withMark } from '@viewfly/core'

import css from './button.scoped.scss'
import { DropdownContextService } from '../dropdown/dropdown-context.service'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  highlight?: boolean
  arrow?: boolean
  ordinary?: boolean
}

export const Button = withMark(css, function (props: ButtonProps) {
  const dropdownContextService = inject(DropdownContextService, null)
  const isActive = createSignal(dropdownContextService?.isOpen || false)
  if (dropdownContextService) {
    const subscription = dropdownContextService.onOpenStateChange.subscribe(b => {
      isActive.set(b)
    })

    onUnmounted(() => {
      subscription.unsubscribe()
    })
  }
  return () => {
    return (
      <button type="button" {...props} class={[
        'btn',
        {
          active: props.ordinary ? false : isActive(),
          highlight: props.highlight
        },
        props.class
      ]}>
        <span>
          {props.children}
        </span>
        {
          props.arrow && <span class={['btn-arrow', 'xnote-icon-arrow-bottom']}/>
        }
      </button>
    )
  }
})
