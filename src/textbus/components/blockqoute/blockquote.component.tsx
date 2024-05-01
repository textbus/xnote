import {
  Component,
  ContentType,
  createVNode,
  Slot,
  ComponentStateLiteral,
  Textbus, Registry, ZenCodingGrammarInterceptor,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'

import './blockquote.component.scss'
import { deltaToBlock } from '../paragraph/paragraph.component'

export interface BlockquoteComponentState {
  slot: Slot
}

export class BlockquoteComponent extends Component<BlockquoteComponentState> {
  static type = ContentType.BlockComponent
  static componentName = 'BlockquoteComponent'
  static zenCoding: ZenCodingGrammarInterceptor<BlockquoteComponentState> = {
    key: ' ',
    match: /^>$/,
    createState(): BlockquoteComponentState {
      return {
        slot: new Slot([
          ContentType.Text,
          ContentType.InlineComponent,
          ContentType.BlockComponent
        ])
      }
    }
  }

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<BlockquoteComponentState>) {
    const slot = textbus.get(Registry).createSlot(json.slot)
    return new BlockquoteComponent(textbus, {
      slot
    })
  }

  constructor(textbus: Textbus, state: BlockquoteComponentState = {
    slot: new Slot([
      ContentType.Text,
      ContentType.InlineComponent,
      ContentType.BlockComponent
    ])
  }) {
    super(textbus, state)
  }
}

export function BlockquoteView(props: ViewComponentProps<BlockquoteComponent>) {
  const adapter = inject(DomAdapter)
  return () => {
    const slot = props.component.state.slot
    return adapter.slotRender(slot, children => {
      return createVNode('div', {
        class: 'xnote-blockquote',
        ref: props.rootRef
      }, children)
    }, false)
  }
}

export const blockquoteComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'BLOCKQUOTE'
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): Component {
    const delta = slotParser(new Slot([
      ContentType.Text,
      ContentType.BlockComponent,
      ContentType.InlineComponent
    ]), element).toDelta()

    const slot = new Slot([
      ContentType.BlockComponent,
      ContentType.InlineComponent,
      ContentType.Text
    ])

    deltaToBlock(delta, textbus).forEach(i => {
      slot.insert(i)
    })
    return new BlockquoteComponent(textbus, {
      slot
    })
  },
}
