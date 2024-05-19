import {
  Component,
  CompositionStartEventData,
  ComponentStateLiteral,
  ContentType,
  createVNode,
  Event,
  onCompositionStart,
  Slot,
  Subject,
  Textbus,
  Registry,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { inject, createDynamicRef } from '@viewfly/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'

import './root.component.scss'
import { deltaToBlock } from '../paragraph/paragraph.component'
import { useBlockContent } from '../../hooks/use-block-content'
import { useReadonly } from '../../hooks/use-readonly'
import { useOutput } from '../../hooks/use-output'

export interface RootComponentState {
  content: Slot
}

export class RootComponent extends Component<RootComponentState> {
  static componentName = 'RootComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<RootComponentState>) {
    const content = textbus.get(Registry).createSlot(json.content)
    return new RootComponent(textbus, {
      content
    })
  }

  onCompositionStart = new Subject<Event<Slot, CompositionStartEventData>>()

  override setup() {
    useBlockContent(this.state.content)

    onCompositionStart(ev => {
      this.onCompositionStart.next(ev)
    })
  }
}

export function RootView(props: ViewComponentProps<RootComponent>) {
  const adapter = inject(DomAdapter)
  const { content } = props.component.state
  const ref = createDynamicRef<HTMLDivElement>(node => {
    const sub = props.component.onCompositionStart.subscribe(() => {
      (node.children[0] as HTMLElement).dataset.placeholder = ''
    })
    return () => {
      sub.unsubscribe()
    }
  })

  const readonly = useReadonly()
  const output = useOutput()
  return () => {
    const { rootRef } = props

    return (
      <div class="xnote-root" ref={[rootRef, ref]}>
        {
          adapter.slotRender(content, children => {
            return (
              createVNode('div', {
                class: 'xnote-content',
                'data-placeholder': content.isEmpty ? '请输入内容' : ''
              }, children)
            )
          }, readonly() || output())
        }
      </div>
    )
  }
}

export const rootComponentLoader: ComponentLoader = {
  match(): boolean {
    return true
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): Component | Slot {
    const delta = slotParser(new Slot([
      ContentType.BlockComponent,
      ContentType.InlineComponent,
      ContentType.Text
    ]), element).toDelta()
    const slot = new Slot([
      ContentType.BlockComponent,
      ContentType.InlineComponent,
      ContentType.Text
    ])

    deltaToBlock(delta, textbus).forEach(i => {
      slot.insert(i)
    })
    return slot
  }
}
