import { Slot, createVNode, merge } from '@textbus/core'
import { DomAdapter } from '@textbus/platform-browser'
import { DynamicRef, getCurrentInstance, inject, onUnmounted, watch } from '@viewfly/core'
import { HTMLAttributes } from '@viewfly/platform-browser'

export interface SlotRenderProps extends HTMLAttributes<unknown> {
  slot: Slot
  /** 默认值为 div */
  tag?: string
  class?: string
  renderEnv?: boolean
  elRef?: DynamicRef<HTMLElement>
  elKey?: number | string
}

export function SlotRender(props: SlotRenderProps) {
  const adapter = inject(DomAdapter)

  const instance = getCurrentInstance()
  const slot = props.slot

  function listen(slot: Slot) {
    return merge(slot.__changeMarker__.onChange, slot.__changeMarker__.onForceChange).subscribe(() => {
      if (props.slot.__changeMarker__.dirty) {
        instance.markAsDirtied()
      }
    })
  }

  let sub = listen(slot)

  watch(() => {
    return props.slot
  }, (currentSlot, oldSlot) => {
    if (oldSlot !== currentSlot) {
      sub.unsubscribe()
      sub = listen(currentSlot)
    }
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  return () => {
    const { slot, tag = 'div', renderEnv = false, elRef, elKey, ...rest } = props
    return adapter.slotRender(slot, children => {
      return createVNode(tag, { ref: elRef, key: elKey, ...rest }, children)
    }, renderEnv)
  }
}
