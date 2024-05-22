import {
  Component,
  ContentType,
  createVNode,
  Slot,
  ComponentStateLiteral,
  Textbus, Registry, ZenCodingGrammarInterceptor, Selection,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'

import './blockquote.component.scss'
import { deltaToBlock, ParagraphComponent } from '../paragraph/paragraph.component'
import { useBlockContent } from '../../hooks/use-block-content'
import { useReadonly } from '../../hooks/use-readonly'
import { useOutput } from '../../hooks/use-output'

export interface BlockquoteComponentState {
  slot: Slot
}

export class BlockquoteComponent extends Component<BlockquoteComponentState> {
  static type = ContentType.BlockComponent
  static componentName = 'BlockquoteComponent'
  static zenCoding: ZenCodingGrammarInterceptor<BlockquoteComponentState> = {
    key: ' ',
    match(content, textbus) {
      const selection = textbus.get(Selection)
      if (selection.commonAncestorComponent instanceof ParagraphComponent) {
        return /^>$/.test(content)
      }
      return false
    },
    createState(): BlockquoteComponentState {
      return {
        slot: new Slot([
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
      ContentType.BlockComponent
    ])
  }) {
    super(textbus, state)
  }

  override setup() {
    useBlockContent(this.state.slot)
  }
}

export function BlockquoteView(props: ViewComponentProps<BlockquoteComponent>) {
  const adapter = inject(DomAdapter)
  const readonly = useReadonly()
  const output = useOutput()
  return () => {
    const slot = props.component.state.slot
    return (
      <blockquote class="xnote-blockquote" ref={props.rootRef} data-component={props.component.name}>
        {
          adapter.slotRender(slot, children => {
            return createVNode('div', null, children)
          }, readonly() || output())
        }
      </blockquote>
    )
  }
}

export const blockquoteComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'BLOCKQUOTE'
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): Component {
    const delta = slotParser(new Slot([
      ContentType.BlockComponent,
    ]), element).toDelta()

    const slot = new Slot([
      ContentType.BlockComponent,
    ])

    deltaToBlock(delta, textbus).forEach(i => {
      slot.insert(i)
    })
    return new BlockquoteComponent(textbus, {
      slot
    })
  },
}
