import {
  ComponentInstance,
  ContentType,
  createVNode,
  defineComponent,
  Slot,
  Textbus,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'

import './blockquote.component.scss'

export const blockquoteComponent = defineComponent({
  type: ContentType.BlockComponent,
  name: 'BlockquoteComponent',
  zenCoding: {
    key: ' ',
    match: /^>$/,
    generateInitData() {
      return {
        slots: [new Slot([
          ContentType.Text,
          ContentType.InlineComponent,
          ContentType.BlockComponent
        ])]
      }
    }
  },
  validate(_, data) {
    return {
      slots: data?.slots || [new Slot([
        ContentType.Text,
        ContentType.InlineComponent,
        ContentType.BlockComponent
      ])]
    }
  },
})

export function BlockquoteView(props: ViewComponentProps<typeof blockquoteComponent>) {
  const adapter = inject(DomAdapter)
  return () => {
    const slot = props.component.slots.first!
    return adapter.slotRender(slot, children => {
      return createVNode('div', {
        class: 'xnote-blockquote',
        ref: props.rootRef
      }, children)
    }, false)
  }
}

export const blockquoteComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'BLOCKQUOTE'
  },
  read(element: HTMLElement, injector: Textbus, slotParser: SlotParser): ComponentInstance {
    const slot = slotParser(new Slot([
      ContentType.Text,
      ContentType.BlockComponent,
      ContentType.InlineComponent
    ]), element)
    return blockquoteComponent.createInstance(injector, {
      slots: [slot]
    })
  },
}
