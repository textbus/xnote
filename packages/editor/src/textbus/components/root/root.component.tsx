import {
  Component,
  CompositionStartEventData,
  ComponentStateLiteral,
  ContentType,
  Event,
  onCompositionStart,
  Slot,
  Subject,
  Textbus,
  Registry, onSlotSetAttribute, onSlotApplyFormat, Selection, useContext, Commander,
} from '@textbus/core'
import { ComponentLoader, SlotParser } from '@textbus/platform-browser'
import { createDynamicRef, createRef, createSignal, inject, onMounted } from '@viewfly/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'

import './root.component.scss'
import { deltaToBlock, ParagraphComponent } from '../paragraph/paragraph.component'
import { useBlockContent } from '../../hooks/use-block-content'
import { useReadonly } from '../../hooks/use-readonly'
import { useOutput } from '../../hooks/use-output'
import { ListComponent } from '../list/list.component'
import { TodolistComponent } from '../todolist/todolist.component'
import { SlotRender } from '../SlotRender'
import { I18nService } from '../../../services/i18n.service'
import { CommentService } from '../../../services/comment.service'

export interface RootComponentState {
  content: Slot
}

export class RootComponent extends Component<RootComponentState> {
  static componentName = 'RootComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<RootComponentState>) {
    const content = textbus.get(Registry).createSlot(json.content)
    return new RootComponent({
      content
    })
  }

  onCompositionStart = new Subject<Event<Slot, CompositionStartEventData>>()

  override getSlots(): Slot[] {
    return [this.state.content]
  }

  override setup() {
    const commander = useContext(Commander)
    const selection = useContext(Selection)
    useBlockContent((slot) => slot === this.state.content)

    onCompositionStart(ev => {
      this.onCompositionStart.next(ev)
    })
    onSlotSetAttribute(ev => {
      ev.preventDefault()
    })

    onSlotApplyFormat(event => {
      if (event.target.isEmpty) {
        const p = new ParagraphComponent()
        commander.insert(p)
        selection.setPosition(p.state.slot, 0)
        commander.applyFormat(event.data.formatter, event.data.value)
      }
      event.preventDefault()
    })
  }

  afterCheck() {
    const content = this.state.content
    const lastContent = content.getContentAtIndex(content.length - 1)
    if (lastContent instanceof ParagraphComponent ||
      lastContent instanceof ListComponent ||
      lastContent instanceof TodolistComponent) {
      return
    }

    const selection = this.textbus!.get(Selection)
    content.retain(content.length)
    const newParagraph = new ParagraphComponent()
    content.insert(newParagraph)
    selection.setPosition(newParagraph.state.slot, 0)
  }
}

export function RootView(props: ViewComponentProps<RootComponent>) {
  const i18n = inject(I18nService)
  const ref = createDynamicRef<HTMLDivElement>(node => {
    const sub = props.component.onCompositionStart.subscribe(() => {
      const el = node.children[0] as HTMLElement
      if (el) {
        el.dataset.placeholder = ''
      }
    })
    return () => {
      sub.unsubscribe()
    }
  })

  const containerRef = createRef<HTMLDivElement>()

  const readonly = useReadonly()
  const output = useOutput()

  function checkContent(ev: MouseEvent) {
    if (ev.target === containerRef.value) {
      const rect = containerRef.value!.getBoundingClientRect()
      if (rect.bottom - ev.clientY < 40) {
        props.component.afterCheck()
      }
    }
  }

  const commentActiveStyle = createSignal('')

  const commentService = inject(CommentService, null)

  onMounted(() => {
    if (!commentService) {
      return
    }
    const sub = commentService.onActive.subscribe(v => {
      commentActiveStyle.set(v?.id || '')
    })

    return () => sub.unsubscribe()
  })


  return () => {
    const { rootRef } = props
    const { content } = props.component.state

    return (
      <div class="xnote-root"
           onClick={checkContent}
           style={!readonly() ? {
             paddingBottom: '40px'
           } : {}}
           dir="auto"
           ref={[rootRef, containerRef, ref]}
           data-component={props.component.name}>
        {
          commentActiveStyle() && (
            <style>
              {
                `[data-comment-id="${commentActiveStyle()}"] {
                ${commentService?.getActiveCSSText?.() || 'background-color: rgb(255 153 0 / 0.2)'}
              }`
              }
            </style>
          )
        }
        <SlotRender
          slot={content}
          tag="div"
          class="xnote-content"
          data-placeholder={content.isEmpty ? i18n.t('root.placeholder') : ''}
          renderEnv={readonly() || output()}
        />
      </div>
    )
  }
}

export const rootComponentLoader: ComponentLoader = {
  match(): boolean {
    return true
  },
  read(element: HTMLElement, _: Textbus, slotParser: SlotParser): Component | Slot {
    const delta = slotParser(new Slot([
      ContentType.BlockComponent,
      ContentType.InlineComponent,
      ContentType.Text
    ]), element).toDelta()
    const slot = new Slot([
      ContentType.BlockComponent
    ])

    deltaToBlock(delta).forEach(i => {
      slot.insert(i)
    })
    return slot
  }
}
