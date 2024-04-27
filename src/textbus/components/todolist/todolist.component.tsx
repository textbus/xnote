import {
  Commander,
  Component,
  ComponentStateLiteral,
  ContentType,
  createVNode,
  onBreak,
  Registry,
  Selection,
  Slot,
  Textbus,
  useContext
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'

import './todolist.component.scss'
import { ParagraphComponent } from '../paragraph/paragraph.component'

export interface TodolistComponentState {
  checked: boolean
  slot: Slot
}

export class TodolistComponent extends Component<TodolistComponentState> {
  static type = ContentType.BlockComponent
  static componentName = 'TodoListComponent'

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<TodolistComponentState>) {
    const slot = textbus.get(Registry).createSlot(json.slot)
    return new TodolistComponent(textbus, {
      slot,
      checked: json.checked
    })
  }

  override setup() {
    const textbus = useContext()
    const commander = useContext(Commander)
    const selection = useContext(Selection)
    onBreak(ev => {
      const slot = ev.target.cut(ev.data.index)
      if (ev.target.isEmpty && slot.isEmpty) {
        const beforeIndex = this.parent!.indexOf(this)
        const beforeComponent = this.parent!.getContentAtIndex(beforeIndex)
        if (beforeComponent instanceof TodolistComponent && beforeComponent.state.slot.isEmpty) {
          const nextComponent = new ParagraphComponent(textbus, {
            slot: new Slot([
              ContentType.Text,
              ContentType.InlineComponent
            ])
          })
          nextComponent.state.slot.insertDelta(slot.toDelta())
          commander.insertAfter(nextComponent, this)
          commander.removeComponent(this)
          selection.setPosition(nextComponent.state.slot, 0)
          ev.preventDefault()
          return
        }
      }
      const nextParagraph = new TodolistComponent(textbus, {
        checked: this.state.checked,
        slot
      })
      commander.insertAfter(nextParagraph, this)
      selection.setPosition(slot, 0)
      ev.preventDefault()
    })
  }
}

export function TodolistView(props: ViewComponentProps<TodolistComponent>) {
  const adapter = inject(DomAdapter)
  const state = props.component.state

  function toggle() {
    state.checked = !state.checked
  }

  return () => {
    const { slot, checked } = state
    return (
      <div data-component={TodolistComponent.componentName} ref={props.rootRef} class="xnote-todolist">
        <div class="xnote-todolist-icon" onClick={toggle}>
          <span data-checked={checked} class={[checked ? 'xnote-icon-checkbox-checked' : 'xnote-icon-checkbox-unchecked']}/>
        </div>
        {
          adapter.slotRender(slot, children => {
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
    return element.dataset.component === TodolistComponent.componentName
  },
  read(element: HTMLElement, injector: Textbus, slotParser: SlotParser): Component | Slot {
    const slot = slotParser(new Slot([
      ContentType.Text,
      ContentType.InlineComponent
    ]), element.children[1] as HTMLElement)
    return new TodolistComponent(injector, {
      checked: element.children[0]!.hasAttribute('checked'),
      slot
    })
  }
}
