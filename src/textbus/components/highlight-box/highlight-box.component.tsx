import {
  Component,
  ContentType,
  createVNode,
  ComponentStateLiteral,
  Slot,
  Textbus,
  Registry,
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, createRef } from '@viewfly/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'

import { deltaToBlock } from '../paragraph/paragraph.component'
import './highlight.component.scss'
import { Dropdown } from '../../../components/dropdown/dropdown'
import { useBlockContent } from '../../hooks/use-block-content'

export interface HighlightBoxComponentState {
  type: string
  slot: Slot
}

export class HighlightBoxComponent extends Component<HighlightBoxComponentState> {
  static componentName = 'HighlightBoxComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<HighlightBoxComponentState>) {
    return new HighlightBoxComponent(textbus, {
      type: json.type,
      slot: textbus.get(Registry).createSlot(json.slot)
    })
  }

  constructor(textbus: Textbus, state: HighlightBoxComponentState = {
    type: '',
    slot: new Slot([
      ContentType.BlockComponent
    ])
  }) {
    super(textbus, state)
  }

  override setup() {
    useBlockContent(this.state.slot)
  }
}

export function HighlightBoxView(props: ViewComponentProps<HighlightBoxComponent>) {
  const adapter = inject(DomAdapter)
  const emoji: number[] = []
  for (let i = 0x1F600; i <= 0x1F64F; i++) {
    emoji.push(i)
  }
  const dropdownRef = createRef<typeof Dropdown>()

  function setType(type: string) {
    dropdownRef.current?.isShow(false)
    props.component.state.type = type
  }


  return () => {
    const { state, name } = props.component
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
          adapter.slotRender(state.slot, children => {
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
    return element.tagName === 'DIV' && element.dataset.component === HighlightBoxComponent.componentName
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): Component | Slot | void {
    const delta = slotParser(new Slot([
      ContentType.BlockComponent,
      ContentType.InlineComponent,
      ContentType.Text
    ]), element.querySelector('.xnote-highlight-box-content')!).toDelta()

    const slot = new Slot([
      ContentType.BlockComponent,
      ContentType.InlineComponent,
      ContentType.Text
    ])

    deltaToBlock(delta, textbus).forEach(i => {
      slot.insert(i)
    })
    return new HighlightBoxComponent(textbus, {
      type: element.dataset.icon || '',
      slot
    })
  }
}
