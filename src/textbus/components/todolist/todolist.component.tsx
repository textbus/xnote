import { ComponentInstance, ContentType, createVNode, defineComponent, Slot } from '@textbus/core'

import './todolist.component.scss'
import { ComponentLoader, SlotParser } from '@textbus/platform-browser'
import { Adapter, ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, Injector } from '@viewfly/core'

export const todolistComponent = defineComponent({
  type: ContentType.BlockComponent,
  name: 'TodoListComponent',
  validate(initData) {
    return {
      slots: [
        initData?.slots?.[0] || new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
      ]
    }
  }
})

export function Todolist(props: ViewComponentProps<typeof todolistComponent>) {
  const adapter = inject(Adapter)
  return () => {
    const first = props.component.slots.first!
    return (
      <div data-component={todolistComponent.name} ref={props.rootRef} class="xnote-todolist">
        <div class="xnote-todolist-icon">
          <div class="xnote-todolist-checkbox"></div>
        </div>
        {
          adapter.slotRender(first, children => {
            return createVNode('div', {
              class: 'xnote-todolist-content'
            }, children)
          }, false)
        }
      </div>
    )
  }
}

export const todolistComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.component === todolistComponent.name
  },
  read(element: HTMLElement, injector: Injector, slotParser: SlotParser): ComponentInstance | Slot {
    slotParser
    return todolistComponent.createInstance(injector)
  }
}
