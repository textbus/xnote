import { ComponentInstance, ContentType, defineComponent, Injector, Slot, useSlots } from '@textbus/core'

import './todolist.component.scss'
import { ComponentLoader, SlotParser } from '@textbus/platform-browser'

export const todolistComponent = defineComponent({
  type: ContentType.BlockComponent,
  name: 'TodoListComponent',
  setup() {
    const slots = useSlots([
      new Slot([
        ContentType.InlineComponent,
        ContentType.Text
      ])
    ])
    // const
    return {
      render(slotRender) {
        return (
          <div data-component={todolistComponent.name} class="xnote-todolist">
            <div class="xnote-todolist-icon">
              <div class="xnote-todolist-checkbox"></div>
            </div>
            {
              slotRender(slots.get(0)!, children => {
                return (
                  <div class="xnote-todolist-content">{children}</div>
                )
              })
            }
          </div>
        )
      }
    }
  }
})

export const todolistComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.component === todolistComponent.name
  },
  read(element: HTMLElement, injector: Injector, slotParser: SlotParser): ComponentInstance | Slot {
    return todolistComponent.createInstance(injector)
  }
}
