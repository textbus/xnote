import {
  Commander,
  ComponentInitData,
  ComponentInstance,
  ContentType,
  createVNode,
  defineComponent, ExtractComponentInstanceType,
  onBreak,
  Selection,
  Slot,
  Textbus,
  useContext,
  useSelf
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'

import './list.component.scss'

export interface ListComponentState {
  type: 'OrderedList' | 'UnorderedList'
}

export const listComponent = defineComponent({
  name: 'ListComponent',
  type: ContentType.BlockComponent,
  validate(textbus, data?: ComponentInitData<ListComponentState>) {
    return {
      slots: data?.slots || [new Slot<unknown>([
        ContentType.InlineComponent,
        ContentType.Text
      ])],
      state: {
        type: data?.state?.type || 'OrderedList'
      }
    }
  },
  setup() {
    const textbus = useContext()
    const self = useSelf<ExtractComponentInstanceType<typeof listComponent>>()
    const commander = useContext(Commander)
    const selection = useContext(Selection)
    onBreak(ev => {
      const afterContentDelta = ev.target.cut(ev.data.index).toDelta()
      const nextList = listComponent.createInstance(textbus, {
        state: {
          type: self.state.type
        }
      })
      const slot = nextList.slots.get(0)!
      slot.insertDelta(afterContentDelta)
      commander.insertAfter(nextList, self)
      selection.setPosition(slot, 0)
      ev.preventDefault()
    })
  }
})

export function ListComponentView(props: ViewComponentProps<typeof listComponent>) {
  const adapter = inject(DomAdapter)
  return () => {
    const ListType = props.component.state.type === 'UnorderedList' ? 'ul' : 'ol'
    return (
      <ListType ref={props.rootRef} data-component={props.component.name} class="xnote-list">
        <li>
          <div></div>
          {
            adapter.slotRender(props.component.slots.first, children => {
              return createVNode('div', {
                class: 'xnote-list-content'
              }, children)
            }, false)
          }
        </li>
      </ListType>
    )
  }
}

export const listComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'UL' || element.tagName === 'OL'
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): ComponentInstance | Slot | void {
    const slot = slotParser(new Slot([
      ContentType.InlineComponent,
      ContentType.Text
    ]), element.querySelector('.xnote-list-content') || document.createElement('div'))
    return listComponent.createInstance(textbus, {
      slots: [
        slot
      ],
      state: {
        type: element.tagName === 'OL' ? 'OrderedList' : 'UnorderedList'
      }
    })
  }
}

