import {
  Commander,
  Component,
  ContentType,
  ComponentStateLiteral,
  createVNode,
  onBreak,
  Selection,
  Slot,
  Textbus,
  useContext, Registry,
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'

import './list.component.scss'

export interface ListComponentState {
  type: 'OrderedList' | 'UnorderedList'
  slot: Slot
}

export class ListComponent extends Component<ListComponentState> {
  static componentName = 'ListComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<ListComponentState>) {
    return new ListComponent(textbus, {
      type: json.type,
      slot: textbus.get(Registry).createSlot(json.slot)
    })
  }

  override setup() {
    const textbus = useContext()
    const commander = useContext(Commander)
    const selection = useContext(Selection)
    onBreak(ev => {
      const slot = ev.target.cut(ev.data.index)
      const nextList = new ListComponent(textbus, {
        slot,
        type: this.state.type
      })
      commander.insertAfter(nextList, this)
      selection.setPosition(slot, 0)
      ev.preventDefault()
    })
  }
}

export function ListComponentView(props: ViewComponentProps<ListComponent>) {
  const adapter = inject(DomAdapter)
  return () => {
    const ListType = props.component.state.type === 'UnorderedList' ? 'ul' : 'ol'
    return (
      <ListType ref={props.rootRef} data-component={props.component.name} class="xnote-list">
        <li>
          <div></div>
          {
            adapter.slotRender(props.component.state.slot, children => {
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
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): Component | Slot | void {
    const slot = slotParser(new Slot([
      ContentType.InlineComponent,
      ContentType.Text
    ]), element.querySelector('.xnote-list-content') || document.createElement('div'))
    return new ListComponent(textbus, {
      slot,
      type: element.tagName === 'OL' ? 'OrderedList' : 'UnorderedList'
    })
  }
}

