import {
  Commander,
  ComponentInstance,
  ContentType,
  createVNode,
  defineComponent,
  ExtractComponentInstanceType,
  onBreak,
  Slot,
  useContext,
  useSelf,
  Selection
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, Injector } from '@viewfly/core'

import './todolist.component.scss'

export interface TodolistComponentState {
  checked: boolean
}

export const todolistComponent = defineComponent<TodolistComponentState>({
  type: ContentType.BlockComponent,
  name: 'TodoListComponent',
  validate(initData) {
    return {
      slots: [
        initData?.slots?.[0] || new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
      ],
      state: {
        checked: (initData?.state as any)?.checked || false
      }
    }
  },
  setup() {
    const textbus = useContext()
    const commander = useContext(Commander)
    const selection = useContext(Selection)
    const self = useSelf<ExtractComponentInstanceType<typeof todolistComponent>>()
    onBreak(ev => {
      const afterContentDelta = ev.target.cut(ev.data.index).toDelta()
      const nextParagraph = todolistComponent.createInstance(textbus, {
        state: {
          checked: self.state.checked
        }
      })
      const slot = nextParagraph.slots.get(0)!
      slot.insertDelta(afterContentDelta)
      commander.insertAfter(nextParagraph, self)
      selection.setPosition(slot, 0)
      ev.preventDefault()
    })
  }
})

export function Todolist(props: ViewComponentProps<typeof todolistComponent>) {
  const adapter = inject(DomAdapter)

  function toggle() {
    props.component.updateState(draft => {
      draft.checked = !draft.checked
    })
  }

  return () => {
    const first = props.component.slots.first!
    const checked = props.component.state.checked
    return (
      <div data-component={todolistComponent.name} ref={props.rootRef} class="xnote-todolist">
        <div class="xnote-todolist-icon" onClick={toggle}>
          <span data-checked={checked} class={[checked ? 'xnote-icon-checkbox-checked' : 'xnote-icon-checkbox-unchecked']}/>
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
    const slot = slotParser(new Slot([
      ContentType.Text,
      ContentType.InlineComponent
    ]), element.children[1] as HTMLElement)
    return todolistComponent.createInstance(injector, {
      slots: [slot],
      state: {
        checked: element.children[0]!.hasAttribute('checked')
      }
    })
  }
}
