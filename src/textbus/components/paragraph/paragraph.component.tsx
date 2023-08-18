import {
  Commander,
  ComponentInstance,
  ContentType, createVNode,
  defineComponent,
  onBreak,
  Selection,
  Slot,
  useContext,
  useSelf,
  useSlots
} from '@textbus/core'
import { ComponentLoader, DomAdapter } from '@textbus/platform-browser'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, Injector } from '@viewfly/core'

import './paragraph.component.scss'

export const paragraphComponent = defineComponent({
  name: 'ParagraphComponent',
  type: ContentType.BlockComponent,
  setup() {
    const self = useSelf()
    const injector = useContext()
    const commander = injector.get(Commander)
    const selection = injector.get(Selection)
    useSlots([
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
  }
})

export function Paragraph(props: ViewComponentProps<typeof paragraphComponent>) {
  const adapter = inject(DomAdapter)
  return () => {
    const slot = props.component.slots.first!
    return (
      <div class="xnote-paragraph" ref={props.rootRef} data-component={paragraphComponent.name}>
        {
          adapter.slotRender(slot, children => {
            return (
              createVNode('p', null, children)
            )
          })
        }
      </div>
    )
  }
}

export const paragraphComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.compoment === paragraphComponent.name
  },
  read(element: HTMLElement, injector: Injector): ComponentInstance | Slot {
    return paragraphComponent.createInstance(injector)
  }
}
