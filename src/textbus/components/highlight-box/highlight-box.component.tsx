import {
  ComponentInitData,
  ComponentInstance,
  ContentType,
  createVNode,
  defineComponent,
  onBreak,
  onContentInsert,
  Selection,
  Slot,
  Textbus,
  useContext,
  useSelf
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, createRef } from '@viewfly/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'

import { paragraphComponent } from '../paragraph/paragraph.component'
import './highlight.component.scss'
import { Dropdown } from '../../../components/dropdown/dropdown'

export interface HighlightBoxComponentState {
  type: string
}

export const highlightBoxComponent = defineComponent({
  name: 'HighlightBoxComponent',
  type: ContentType.BlockComponent,
  validate(_, initData?: ComponentInitData<HighlightBoxComponentState>): ComponentInitData<HighlightBoxComponentState> {
    return {
      slots: [
        initData?.slots?.[0] || new Slot([ContentType.BlockComponent, ContentType.Text, ContentType.InlineComponent])
      ],
      state: {
        type: initData?.state?.type || String.fromCodePoint(0x1F600),
      }
    }
  },
  setup() {
    const slots = useSelf().slots
    const textbus = useContext()
    const selection = useContext(Selection)
    onBreak(ev => {
      if (ev.target === slots.get(0)!) {
        const afterContentDelta = ev.target.cut(ev.data.index).toDelta()
        const p = paragraphComponent.createInstance(textbus)
        const slot = p.slots.get(0)!
        slot.insertDelta(afterContentDelta)
        const body = slots.get(1)!
        body.retain(0)
        body.insert(p)
        selection.setPosition(slot, 0)
        ev.preventDefault()
      }
    })

    onContentInsert(ev => {
      if (ev.target === slots.get(0) && (typeof ev.data.content === 'string' || ev.data.content.type !== ContentType.BlockComponent)) {
        const p = paragraphComponent.createInstance(textbus)
        const slot = p.slots.get(0)!
        slot.insert(ev.data.content)
        ev.target.insert(p)
        selection.setPosition(slot, slot.index)
        ev.preventDefault()
      }
    })
  }
})

export function HighlightBoxView(props: ViewComponentProps<typeof highlightBoxComponent>) {
  const adapter = inject(DomAdapter)
  const emoji: number[] = []
  for (let i = 0x1F600; i <= 0x1F64F; i++) {
    emoji.push(i)
  }
  const dropdownRef = createRef<typeof Dropdown>()

  function setType(type: string) {
    dropdownRef.current?.isShow.set(false)
    props.component.updateState(draft => {
      draft.type = type
    })
  }


  return () => {
    const { slots, state, name } = props.component
    return (
      <div data-component={name} ref={props.rootRef} data-icon={state.type} class="xnote-highlight-box">
        <div class="xnote-highlight-box-left">
          <Dropdown ref={dropdownRef} width="210px" menu={
            <div class="xnote-highlight-box-icons">
              {
                emoji.map(i => {
                  const icon = String.fromCodePoint(i)
                  return (
                    <button onClick={() => setType(icon)} type="button">{icon}</button>
                  )
                })
              }
            </div>
          }>
            <div class="xnote-highlight-box-icon">
              <button type="button">{state.type || 'cc'}</button>
            </div>
          </Dropdown>
        </div>
        {
          adapter.slotRender(slots.first, children => {
            return createVNode('div', {
              class: 'xnote-highlight-box-content'
            }, children)
          }, false)
        }
      </div>
    )
  }
}

export const highlightBoxComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'DIV' && element.dataset.component === highlightBoxComponent.name
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): ComponentInstance | Slot | void {
    const slot = slotParser(new Slot([
      ContentType.BlockComponent,
      ContentType.InlineComponent,
      ContentType.Text
    ]), element.querySelector('.xnote-highlight-box-content')!)
    return highlightBoxComponent.createInstance(textbus, {
      slots: [slot],
      state: {
        type: element.dataset.icon || ''
      }
    })
  }
}
