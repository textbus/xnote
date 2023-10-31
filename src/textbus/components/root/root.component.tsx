import {
  ComponentInstance,
  CompositionStartEventData,
  ContentType,
  createVNode,
  defineComponent,
  Event,
  onBreak,
  onCompositionStart,
  onContentInsert,
  onSlotRemove,
  Selection,
  Slot,
  Subject, Textbus,
  useContext,
  useSelf,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { inject, useRef } from '@viewfly/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'

import './root.component.scss'
import { paragraphComponent } from '../paragraph/paragraph.component'
import { LeftToolbarService } from '../../../services/left-toolbar.service'

export const rootComponent = defineComponent({
  name: 'RootComponent',
  type: ContentType.BlockComponent,
  validate(_, initData) {
    return {
      slots: [
        new Slot([
          ContentType.Text
        ]),
        initData?.slots?.[0] || new Slot([
          ContentType.BlockComponent,
          ContentType.InlineComponent,
          ContentType.Text
        ])
      ]
    }
  },
  setup() {
    const textbus = useContext()
    const selection = textbus.get(Selection)
    const slots = useSelf().slots

    onSlotRemove(ev => {
      ev.preventDefault()
    })

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
      if (ev.target === slots.get(1) && (typeof ev.data.content === 'string' || ev.data.content.type !== ContentType.BlockComponent)) {
        const p = paragraphComponent.createInstance(textbus)
        const slot = p.slots.get(0)!
        slot.insert(ev.data.content)
        ev.target.insert(p)
        selection.setPosition(slot, slot.index)
        ev.preventDefault()
      }
    })

    const compositionStartEvent = new Subject<Event<Slot, CompositionStartEventData>>()
    onCompositionStart(ev => {
      compositionStartEvent.next(ev)
    })

    return {
      onCompositionStart: compositionStartEvent
    }
  }
})

export function Root(props: ViewComponentProps<typeof rootComponent>) {
  const adapter = inject(DomAdapter)
  const { first, last } = props.component.slots

  const ref = useRef<HTMLDivElement>(node => {
    const sub = props.component.extends.onCompositionStart.subscribe(ev => {
      if (ev.target === props.component.slots.get(0)) {
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
    const { component, rootRef } = props

    return (
      <div class="xnote-root" ref={[rootRef, ref]}>
        {
          adapter.slotRender(first!, children => {
            return (createVNode('div', {
                class: 'xnote-title',
                'data-placeholder': first.isEmpty ? '请输入标题' : ''
              }, children)
            )
          }, false)
        }
        {
          adapter.slotRender(component.slots.last!, children => {
            return (
              createVNode('div', {
                class: 'xnote-content',
                onMousemove: move,
                'data-placeholder': last.isEmpty ? '请输入内容' : ''
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
  read(element: HTMLElement, injector: Textbus, slotParser: SlotParser): ComponentInstance | Slot {
    const slot = slotParser(new Slot([
      ContentType.BlockComponent,
      ContentType.InlineComponent,
      ContentType.Text
    ]), element)
    return rootComponent.createInstance(injector, {
      slots: [slot]
    })
  }
}
