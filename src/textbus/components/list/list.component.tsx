import {
  Commander,
  Component,
  ComponentStateLiteral,
  ContentType,
  createVNode,
  onBreak,
  onParentSlotUpdated,
  Registry,
  Selection,
  Slot,
  Textbus,
  useContext, useDynamicShortcut,
  ZenCodingGrammarInterceptor,
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'

import './list.component.scss'
import { textIndentAttr } from '../../attributes/text-indent.attr'
import { ParagraphComponent } from '../paragraph/paragraph.component'

export interface ListComponentState {
  type: 'OrderedList' | 'UnorderedList'
  slot: Slot
  reorder: boolean
}

export class ListComponent extends Component<ListComponentState> {
  static componentName = 'ListComponent'
  static type = ContentType.BlockComponent

  static zenCoding: ZenCodingGrammarInterceptor<ListComponentState> = {
    key: ' ',
    match: /^([1-9]\.|[+*])$/,
    createState(content: string) {
      return {
        type: /[-+*]/.test(content) ? 'UnorderedList' : 'OrderedList',
        reorder: true,
        slot: new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
      }
    }
  }

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<ListComponentState>) {
    return new ListComponent(textbus, {
      type: json.type,
      reorder: json.reorder,
      slot: textbus.get(Registry).createSlot(json.slot)
    })
  }

  override setup() {
    const textbus = useContext()
    const commander = useContext(Commander)
    const selection = useContext(Selection)
    const updateAfterList = (ref: Component<any>) => {
      if (this.state.type === 'UnorderedList') {
        return
      }
      const parentSlot = ref.parent!
      const index = parentSlot.indexOf(ref)
      const afterContent = parentSlot.sliceContent(index + 1)

      for (const item of afterContent) {
        if (item instanceof ListComponent &&
          item.state.type === 'OrderedList' &&
          item.state.slot.getAttribute(textIndentAttr) === this.state.slot.getAttribute(textIndentAttr)) {
          if (item.state.reorder) {
            break
          }
          item.changeMarker.forceMarkDirtied()
        }
      }
    }

    onParentSlotUpdated(() => {
      this.changeMarker.forceMarkDirtied()
    })
    onBreak(ev => {
      const slot = ev.target.cut(ev.data.index)
      if (ev.target.isEmpty && slot.isEmpty) {
        const beforeIndex = this.parent!.indexOf(this)
        const beforeComponent = this.parent!.getContentAtIndex(beforeIndex - 1)
        if (beforeComponent instanceof ListComponent) {
          const nextComponent = new ParagraphComponent(textbus, {
            slot: new Slot([
              ContentType.Text,
              ContentType.InlineComponent
            ])
          })
          nextComponent.state.slot.insertDelta(slot.toDelta())
          commander.insertAfter(nextComponent, this)
          commander.removeComponent(this)
          selection.setPosition(nextComponent.state.slot, 0)
          updateAfterList(nextComponent)
          ev.preventDefault()
          return
        }
      }
      const nextList = new ListComponent(textbus, {
        slot,
        reorder: false,
        type: this.state.type
      })
      commander.insertAfter(nextList, this)
      selection.setPosition(slot, 0)
      updateAfterList(nextList)
      ev.preventDefault()
    })

    useDynamicShortcut({
      keymap: {
        key: 'Backspace'
      },
      action: (): boolean | void => {
        if (!selection.isCollapsed || selection.startOffset !== 0) {
          return false
        }
        const slot = selection.commonAncestorSlot!.cut()
        const paragraph = new ParagraphComponent(textbus, {
          slot
        })
        commander.replaceComponent(this, paragraph)
        selection.setPosition(slot, 0)
      }
    })
  }
}

const step = 26
const chars = Array.from({ length: step }).map((_, index) => String.fromCharCode(96 + index + 1))

function numberToLetter(num: number) {
  const numbers: number[] = []
  while (true) {
    const n = Math.floor(num / step)
    numbers.push(n)
    num = num % step
    if (num < step) {
      numbers.push(num + 1)
      break
    }
  }
  return numbers.map(i => {
    return chars[i - 1]
  }).join('')
}

export function ListComponentView(props: ViewComponentProps<ListComponent>) {
  const adapter = inject(DomAdapter)
  return () => {
    const component = props.component
    const ListType = component.state.type === 'UnorderedList' ? 'ul' : 'ol'
    const ulIcons = ['•', '◦', '▪']
    let icon = ''
    const indent = component.state.slot.getAttribute(textIndentAttr) || 0
    if (ListType === 'ul') {
      icon = ulIcons[indent % 3]
    } else {
      const parentSlot = component.parent!
      const index = parentSlot.indexOf(component)
      let listStep = 0
      if (!component.state.reorder) {
        const beforeContent = parentSlot.sliceContent(0, index)
        while (beforeContent.length) {
          const content = beforeContent.pop()
          if (content instanceof ListComponent &&
            content.state.type === 'OrderedList') {
            const beforeIndent = content.state.slot.getAttribute(textIndentAttr) || 0
            if (beforeIndent === indent) {
              listStep++
              if (content.state.reorder) {
                break
              }
            } else if (beforeIndent < indent) {
              break
            }
          }
        }
      }

      const level = indent % 3
      if (level === 0) {
        icon = listStep + 1 + '.'
      } else if (level === 1) {
        icon = numberToLetter(listStep).toUpperCase() + '.'
      } else {
        icon = numberToLetter(listStep) + '.'
      }
    }
    return (
      <ListType ref={props.rootRef} data-component={component.name} class="xnote-list" style={{
        marginLeft: indent * 24 + 'px'
      }}>
        <li>
          <div class="xnote-list-type">{icon}</div>
          {
            adapter.slotRender(component.state.slot, children => {
              return createVNode('div', {
                class: 'xnote-list-content'
              }, children)
            }, false)
          }
        </li>
      </ListType>
    )
  }
}

export const listComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'UL' || element.tagName === 'OL'
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): Component | Slot | void {
    const type = element.tagName === 'OL' ? 'OrderedList' : 'UnorderedList'
    if (element.dataset.component === ListComponent.componentName) {
      const slot = slotParser(new Slot([
        ContentType.InlineComponent,
        ContentType.Text
      ]), element.querySelector('.xnote-list-content') || document.createElement('div'))
      return new ListComponent(textbus, {
        slot,
        reorder: true,
        type
      })
    }

    const result = new Slot([
      ContentType.BlockComponent
    ])
    Array.from(element.children).forEach((i, index) => {
      const slot = slotParser(new Slot([
        ContentType.InlineComponent,
        ContentType.Text
      ]), i as HTMLElement)
      const component = new ListComponent(textbus, {
        slot,
        reorder: index === 0,
        type
      })
      result.insert(component)
    })
    return result
  }
}

