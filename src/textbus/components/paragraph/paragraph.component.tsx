import {
  Commander,
  ComponentInstance,
  ContentType,
  createVNode,
  defineComponent,
  onBreak,
  Selection,
  Slot,
  useContext,
  useSelf,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, Injector } from '@viewfly/core'

import './paragraph.component.scss'

export const paragraphComponent = defineComponent({
  name: 'ParagraphComponent',
  type: ContentType.BlockComponent,
  validate(initData) {
    return {
      slots: [
        initData?.slots?.[0] || new Slot([
          ContentType.Text,
          ContentType.InlineComponent
        ])
      ]
    }
  },
  setup() {
    const self = useSelf()
    const injector = useContext()
    const commander = injector.get(Commander)
    const selection = injector.get(Selection)

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
          }, false)
        }
      </div>
    )
  }
}

export const paragraphComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.compoment === paragraphComponent.name || element.tagName === 'P'
  },
  read(element: HTMLElement, injector: Injector, slotParser: SlotParser): ComponentInstance | Slot {
    const slot = slotParser(new Slot([
      ContentType.Text,
      ContentType.InlineComponent
    ]), element)
    return paragraphComponent.createInstance(injector, {
      slots: [slot]
    })
  }
}
