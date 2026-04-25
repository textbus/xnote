import { Component, ComponentStateLiteral, ContentType, Registry, Slot, Textbus, } from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { createRef } from '@viewfly/core'
import { ComponentLoader, SlotParser } from '@textbus/platform-browser'

import { deltaToBlock } from '../paragraph/paragraph.component'
import './highlight.component.scss'
import { Dropdown } from '../../../components/dropdown/dropdown'
import { useBlockContent } from '../../hooks/use-block-content'
import { useReadonly } from '../../hooks/use-readonly'
import { useOutput } from '../../hooks/use-output'
import { SlotRender } from '../SlotRender'

export interface HighlightBoxComponentState {
  type: string
  slot: Slot
}

export class HighlightBoxComponent extends Component<HighlightBoxComponentState> {
  static defaultTypes = ['❤️', '💡', '📌', '✅', '❎', '👍', '🎉', '🚫', '❗']
  static componentName = 'HighlightBoxComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<HighlightBoxComponentState>) {
    return new HighlightBoxComponent({
      type: json.type,
      slot: textbus.get(Registry).createSlot(json.slot)
    })
  }

  constructor(state: HighlightBoxComponentState = {
    type: '',
    slot: new Slot([
      ContentType.BlockComponent,
    ])
  }) {
    super(state)
  }

  override getSlots(): Slot[] {
    return [this.state.slot]
  }

  override setup() {
    useBlockContent(this.state.slot)
  }
}

export function HighlightBoxView(props: ViewComponentProps<HighlightBoxComponent>) {
  const readonly = useReadonly()
  const output = useOutput()
  const emoji: number[] = []
  for (let i = 0x1F600; i <= 0x1F64F; i++) {
    emoji.push(i)
  }
  const dropdownRef = createRef<typeof Dropdown>()

  function setType(type: string) {
    dropdownRef.value?.isShow(false)
    props.component.state.type = type
  }

  return () => {
    const { state, name } = props.component
    if (readonly() || output()) {
      return (
        <div data-component={name} ref={props.rootRef} data-icon={state.type} class="xnote-highlight-box">
          <div class="xnote-highlight-box-left">
            <div class="xnote-highlight-box-icon">
              <button type="button">{state.type || '❤️'}</button>
            </div>
          </div>
          <SlotRender slot={state.slot} class="xnote-highlight-box-content" renderEnv={readonly() || output()}/>
        </div>
      )
    }
    return (
      <div data-component={name} ref={props.rootRef} data-icon={state.type} class="xnote-highlight-box">
        <div class="xnote-highlight-box-left">
          <Dropdown trigger="click" ref={dropdownRef} width="282px" menu={
            <div class="xnote-highlight-box-icons">
              <div class="xnote-highlight-box-heading">常用</div>
              {
                HighlightBoxComponent.defaultTypes.map(icon => {
                  return (
                    <button onClick={() => setType(icon)} type="button">{icon}</button>
                  )
                })
              }
              <div class="xnote-highlight-box-heading">更多</div>
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
              <button type="button">{state.type || '❤️'}</button>
            </div>
          </Dropdown>
        </div>
        <SlotRender slot={state.slot} class="xnote-highlight-box-content" renderEnv={readonly() || output()}/>
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
    ])

    deltaToBlock(delta).forEach(i => {
      slot.insert(i)
    })
    return new HighlightBoxComponent({
      type: element.dataset.icon || '',
      slot
    })
  }
}
