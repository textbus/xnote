import {
  Commander,
  Component,
  ComponentStateLiteral,
  ContentType,
  createVNode, DeltaLite,
  onBreak, Registry,
  Selection,
  Slot,
  Textbus,
  useContext,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'

import './paragraph.component.scss'

export interface ParagraphComponentState {
  slot: Slot
}

export class ParagraphComponent extends Component<ParagraphComponentState> {
  static componentName = 'ParagraphComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<ParagraphComponentState>) {
    const slot = textbus.get(Registry).createSlot(json.slot)
    return new ParagraphComponent(textbus, {
      slot
    })
  }

  override setup() {
    const injector = useContext()
    const commander = injector.get(Commander)
    const selection = injector.get(Selection)

    onBreak(ev => {
      const afterSlot = ev.target.cut(ev.data.index)
      const nextParagraph = new ParagraphComponent(injector, {
        slot: afterSlot
      })
      commander.insertAfter(nextParagraph, this)
      selection.setPosition(afterSlot, 0)
      ev.preventDefault()
    })
  }
}

export function ParagraphView(props: ViewComponentProps<ParagraphComponent>) {
  const adapter = inject(DomAdapter)
  return () => {
    const slot = props.component.state.slot
    return (
      <div class="xnote-paragraph" ref={props.rootRef} data-component={ParagraphComponent.name}>
        {
          adapter.slotRender(slot, children => {
            return (
              createVNode('p', null, children)
            )
          }, false)
        }
      </div>
    )
  }
}

export const paragraphComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.compoment === ParagraphComponent.name || element.tagName === 'P'
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): Component | Slot {
    const delta = slotParser(new Slot([
      ContentType.Text,
      ContentType.InlineComponent,
      ContentType.BlockComponent
    ]), element.tagName === 'P' ? element : element.children[0] as HTMLElement).toDelta()

    const results = deltaToBlock(delta, textbus)

    if (results.length === 1) {
      return results[0]
    }

    const containerSlot = new Slot([
      ContentType.BlockComponent
    ])

    results.forEach(item => {
      containerSlot.insert(item)
    })
    return containerSlot
  }
}

export function deltaToBlock(delta: DeltaLite, textbus: Textbus) {
  const results: Component[] = []

  let slot: Slot | null = null
  for (const item of delta) {
    if (typeof item.insert === 'string' || item.insert.type === ContentType.InlineComponent) {
      if (!slot) {
        slot = new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
        delta.attributes.forEach((value, key) => {
          slot!.setAttribute(key, value)
        })
        results.push(new ParagraphComponent(textbus, {
          slot
        }))
      }
      slot.insert(item.insert, item.formats)
    } else {
      results.push(item.insert)
      slot = null
    }
  }
  return results
}
