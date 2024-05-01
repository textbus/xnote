import {
  Component,
  CompositionStartEventData,
  ComponentStateLiteral,
  ContentType,
  createVNode,
  Event,
  onBreak,
  onCompositionStart,
  onContentInsert,
  Selection,
  Slot,
  Subject,
  Textbus,
  useContext, Registry,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { inject, createDynamicRef } from '@viewfly/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'

import './root.component.scss'
import { deltaToBlock, ParagraphComponent } from '../paragraph/paragraph.component'
import { LeftToolbarService } from '../../../services/left-toolbar.service'

export interface RootComponentState {
  heading: Slot
  content: Slot
}

export class RootComponent extends Component<RootComponentState> {
  static componentName = 'RootComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<RootComponentState>) {
    const heading = textbus.get(Registry).createSlot(json.heading)
    const content = textbus.get(Registry).createSlot(json.content)
    return new RootComponent(textbus, {
      heading,
      content
    })
  }

  onCompositionStart = new Subject<Event<Slot, CompositionStartEventData>>()

  override setup() {
    const textbus = useContext()
    const selection = textbus.get(Selection)

    onBreak(ev => {
      if (ev.target === this.state.heading) {
        const afterContent = ev.target.cut(ev.data.index)
        const p = new ParagraphComponent(textbus, {
          slot: afterContent
        })
        const body = this.state.content
        body.retain(0)
        body.insert(p)
        selection.setPosition(afterContent, 0)
        ev.preventDefault()
      }
    })

    onContentInsert(ev => {
      // const heading = this.state.get('heading')
      const content = this.state.content
      if (ev.target === content && (typeof ev.data.content === 'string' || ev.data.content.type !== ContentType.BlockComponent)) {
        const slot = new Slot([
          ContentType.Text,
          ContentType.InlineComponent
        ])
        const p = new ParagraphComponent(textbus, {
          slot
        })
        slot.insert(ev.data.content)
        ev.target.insert(p)
        selection.setPosition(slot, slot.index)
        ev.preventDefault()
      }
    })

    onCompositionStart(ev => {
      this.onCompositionStart.next(ev)
    })
  }
}

export function RootView(props: ViewComponentProps<RootComponent>) {
  const adapter = inject(DomAdapter)
  const { heading, content } = props.component.state
  const ref = createDynamicRef<HTMLDivElement>(node => {
    const sub = props.component.onCompositionStart.subscribe(ev => {
      if (ev.target === heading) {
        (node.children[0] as HTMLElement).dataset.placeholder = ''
      } else {
        (node.children[1] as HTMLElement).dataset.placeholder = ''
      }
    })
    return () => {
      sub.unsubscribe()
    }
  })


  const leftToolbarService = inject(LeftToolbarService)

  function move(ev: MouseEvent) {
    let currentNode = ev.target as Node | null
    while (currentNode) {
      const slot = adapter.getSlotByNativeNode(currentNode as HTMLElement)
      if (slot) {
        leftToolbarService.updateActivatedSlot(slot.parent === props.component ? null : slot)
        break
      }
      currentNode = currentNode.parentNode
    }
  }

  return () => {
    const { rootRef } = props

    return (
      <div class="xnote-root" ref={[rootRef, ref]}>
        {
          adapter.slotRender(heading!, children => {
            return (createVNode('div', {
                class: 'xnote-title',
                'data-placeholder': heading.isEmpty ? '请输入标题' : ''
              }, children)
            )
          }, false)
        }
        {
          adapter.slotRender(content, children => {
            return (
              createVNode('div', {
                class: 'xnote-content',
                onMousemove: move,
                'data-placeholder': content.isEmpty ? '请输入内容' : ''
              }, children)
            )
          }, false)
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
