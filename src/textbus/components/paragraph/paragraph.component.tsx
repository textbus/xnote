import {
  Commander,
  ComponentInstance,
  ContentType,
  defineComponent,
  Injector,
  onBreak, Selection,
  Slot,
  useContext, useSelf,
  useSlots
} from '@textbus/core';
import { ComponentLoader, SlotParser } from '@textbus/platform-browser';

export const paragraphComponent = defineComponent({
  name: 'ParagraphComponent',
  type: ContentType.BlockComponent,
  setup() {
    const self = useSelf()
    const injector = useContext()
    const commander = injector.get(Commander)
    const selection = injector.get(Selection)
    const slots = useSlots([
      new Slot([
        ContentType.Text,
        ContentType.InlineComponent
      ])
    ])

    onBreak(ev => {
      const afterContentDelta = ev.target.cut(ev.data.index).toDelta()
      const nextParagraph = paragraphComponent.createInstance(injector)
      const slot = nextParagraph.slots.get(0)!
      slot.insertDelta(afterContentDelta)
      commander.insertAfter(nextParagraph, self)
      selection.setPosition(slot, 0)
      ev.preventDefault()
    })

    return {
      render(slotRender) {
        return (
          <div data-component={paragraphComponent.name}>
            {
              slotRender(slots.get(0)!, children => {
                return (
                  <p>{children}</p>
                )
              })
            }
          </div>
        )
      }
    }
  }
})

export const paragraphComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.compoment === paragraphComponent.name
  },
  read(element: HTMLElement, injector: Injector, slotParser: SlotParser): ComponentInstance | Slot {
    return paragraphComponent.createInstance(injector)
  }
}
