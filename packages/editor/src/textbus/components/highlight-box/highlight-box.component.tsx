import { Component, ComponentStateLiteral, ContentType, Registry, Slot, Textbus, } from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'
import { ComponentLoader, SlotParser } from '@textbus/platform-browser'
import { Dropdown } from '@viewfly/ui-components'

import { deltaToBlock } from '../paragraph/paragraph.component'
import './highlight.component.scss'
import { useBlockContent } from '../../hooks/use-block-content'
import { useReadonly } from '../../hooks/use-readonly'
import { useOutput } from '../../hooks/use-output'
import { SlotRender } from '../SlotRender'
import { I18nService } from '../../../services/i18n.service'

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
  const i18n = inject(I18nService)
  const readonly = useReadonly()
  const output = useOutput()
  const emoji: number[] = []
  for (let i = 0x1F600; i <= 0x1F64F; i++) {
    emoji.push(i)
  }

  function setType(type: string) {
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
          <Dropdown dropdown={
            <div class="xnote-highlight-box-icons">
              <div class="xnote-highlight-box-heading">{i18n.t('highlight.common')}</div>
              {
                HighlightBoxComponent.defaultTypes.map(icon => {
                  return (
                    <button onClick={() => setType(icon)} type="button">{icon}</button>
                  )
                })
              }
              <div class="xnote-highlight-box-heading">{i18n.t('highlight.more')}</div>
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
