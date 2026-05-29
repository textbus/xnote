import {
  BehaviorSubject,
  Commander,
  Component,
  ComponentStateLiteral,
  ContentType,
  createVNode,
  onBlur,
  onBreak,
  onFocus,
  onPaste, onSlotApplyFormat, onSlotSetAttribute,
  Registry,
  Selection,
  Slot,
  Textbus,
  useContext,
  useDynamicShortcut,
  VTextNode,
  ZenCodingGrammarInterceptor,
  Decorator, VElement
} from '@textbus/core'
import { ComponentLoader, DomAdapter } from '@textbus/platform-browser'
import highlightjs from 'highlight.js'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { createSignal, inject, onUnmounted } from '@viewfly/core'
import { Button, Dropdown, MenuItem, MenuList, Popover } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import './source-code.component.scss'
import { ParagraphComponent } from '../paragraph/paragraph.component'
import { useReadonly } from '../../hooks/use-readonly'
import { useOutput } from '../../hooks/use-output'
import { I18nService } from '../../../services/i18n.service'

export const languageList: Array<{ label: string, value: string }> = [{
  label: 'JavaScript',
  value: 'JavaScript',
}, {
  label: 'HTML',
  value: 'HTML',
}, {
  label: 'CSS',
  value: 'CSS',
}, {
  label: 'TypeScript',
  value: 'TypeScript',
}, {
  label: 'Java',
  value: 'Java',
}, {
  label: 'C',
  value: 'C',
}, {
  label: 'C++',
  value: 'CPP',
}, {
  label: 'C#',
  value: 'CSharp',
}, {
  label: 'Swift',
  value: 'Swift',
}, {
  label: 'Go',
  value: 'Go'
}, {
  label: 'Kotlin',
  value: 'kotlin'
}, {
  label: 'Python',
  value: 'python'
}, {
  label: 'PHP',
  value: 'php'
}, {
  label: 'JSON',
  value: 'JSON',
}, {
  label: 'Less',
  value: 'Less',
}, {
  label: 'SCSS',
  value: 'SCSS',
}, {
  label: 'Stylus',
  value: 'Stylus',
}, {
  label: 'Tsx/Jsx',
  value: 'Tsx',
}, {
  label: 'XML',
  value: 'xml',
}, {
  label: 'Markdown',
  value: 'markdown',
}, {
  label: 'Shell',
  value: 'shell',
}, {
  label: 'Katex',
  value: 'latex',
}, {
  label: 'Yaml',
  value: 'yaml',
}, {
  label: 'Sql',
  value: 'sql',
}, {
  label: 'Ruby',
  value: 'ruby',
}, {
  label: 'Nginx',
  value: 'nginx',
}, {
  label: 'Dockerfile',
  value: 'dockerfile',
}, {
  label: 'Dart',
  value: 'dart',
}, {
  label: 'Rust',
  value: 'rust',
}, {
  label: '',
  value: '',
}]

export const sourceCodeThemes = [
  'xnote-dark',
  'xnote-dark-blue',
  'github',
  'atom-one-dark',
  'foundation',
  'stackoverflow-light',
  'vs2015',
  'xcode',
  'intellij-light',
  'idea'
]

export interface SourceCodeComponentState {
  lang: string
  theme?: string
  lineNumber?: boolean
  autoBreak?: boolean
  slots: Array<{ slot: Slot, emphasize: boolean }>
}

export interface CodeSlotState {
  emphasize: boolean
  slot: Slot
}

function createCodeSlot(): CodeSlotState {
  return {
    slot: new Slot([ContentType.Text]),
    emphasize: false
  }
}

export class SourceCodeComponent extends Component<SourceCodeComponentState> {
  static type = ContentType.BlockComponent
  static componentName = 'SourceCodeComponent'

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<SourceCodeComponentState>) {
    const registry = textbus.get(Registry)
    return new SourceCodeComponent({
      slots: json.slots.map(item => {
        return {
          slot: registry.createSlot(item.slot),
          emphasize: item.emphasize
        }
      }),
      autoBreak: json.autoBreak,
      lang: json.lang,
      lineNumber: json.lineNumber,
      theme: json.theme
    })
  }

  static zenCoding: ZenCodingGrammarInterceptor<SourceCodeComponentState> = {
    key: ['Enter', ' '],
    match(c: string, textbus) {
      const selection = textbus.get(Selection)
      if (selection.commonAncestorComponent instanceof ParagraphComponent) {
        const matchString = languageList.map(i => i.label || i.value).concat('js', 'ts').join('|').replace(/\+/, '\\+')
        const reg = new RegExp(`^\`\`\`(${matchString})$`, 'i')
        return reg.test(c)
      }
      return false
    },
    createState(content): SourceCodeComponentState {
      const matchString = content.replace(/`/g, '').replace(/\+/, '\\+')
      for (const item of languageList) {
        const reg = new RegExp(`^${matchString}$`, 'i')
        if (reg.test(item.label || item.value)) {
          return {
            lang: item.value,
            theme: '',
            lineNumber: true,
            slots: [createCodeSlot()]
          }
        }
      }
      if (/^js$/i.test(matchString)) {
        return {
          lang: 'JavaScript',
          theme: '',
          lineNumber: true,
          slots: [createCodeSlot()]
        }
      }
      if (/^ts$/i.test(matchString)) {
        return {
          lang: 'TypeScript',
          theme: '',
          lineNumber: true,
          slots: [createCodeSlot()]
        }
      }
      return {
        lang: '',
        theme: '',
        lineNumber: true,
        slots: [createCodeSlot()]
      }
    }
  }

  focus = new BehaviorSubject<boolean>(false)

  override getSlots(): Slot[] {
    return this.state.slots.map(i => i.slot)
  }

  override setup() {
    const textbus = useContext()

    const selection = useContext(Selection)

    onBreak(ev => {
      const slots = this.state.slots
      const parentComponent = selection.commonAncestorComponent!
      const parentSlot = parentComponent.parent!
      if (parentSlot && ev.target.isEmpty && ev.target === slots[slots.length - 1].slot) {
        const prevSlot = slots[slots.length - 2]
        if (prevSlot?.slot.isEmpty) {
          const slot = new Slot([
            ContentType.InlineComponent,
            ContentType.Text
          ])
          const paragraph = new ParagraphComponent({
            slot
          })

          const index = parentSlot.indexOf(parentComponent)
          parentSlot.retain(index + 1)
          slots.pop()
          if (slots.length > 1) {
            const ref = slots.find(i => {
              return i.slot === prevSlot?.slot
            })
            const index = slots.indexOf(ref!)
            slots.splice(index, 1)
          }
          parentSlot.insert(paragraph)
          textbus.nextTick(() => {
            selection.setPosition(slot, 0)
          })
          ev.preventDefault()
          return
        }
      }
      const nextSlot = ev.target.cut(ev.data.index)
      const ref = slots.find(i => i.slot === ev.target)
      const index = slots.indexOf(ref!)
      slots.splice(index + 1, 0, { slot: nextSlot, emphasize: ref?.emphasize || false })

      textbus.nextTick(() => {
        selection.setPosition(nextSlot, 0)
      })
      ev.preventDefault()
    })

    onSlotApplyFormat(ev => {
      ev.preventDefault()
    })
    onSlotSetAttribute(ev => {
      ev.preventDefault()
    })

    onPaste(ev => {
      const codeList: string[] = []
      const sourceCode = ev.data.text

      let str = ''
      let isBreak = true
      for (let i = 0; i < sourceCode.length; i++) {
        const char = sourceCode[i]
        if (char === '\r') {
          if (sourceCode[i + 1] === '\n') {
            i++
          }
          if (str) {
            codeList.push(str)
            str = ''
          }
          if (!isBreak) {
            codeList.push('')
          } else {
            isBreak = false
          }
        } else if (char === '\n') {
          if (str) {
            codeList.push(str)
            str = ''
          }
          if (!isBreak) {
            codeList.push('')
          } else {
            isBreak = false
          }
        } else {
          isBreak = true
          str += char
        }
      }
      if (str) {
        codeList.push(str)
      }
      const firstCode = codeList.shift()
      const target = ev.target
      if (firstCode) {
        target.insert(firstCode)
      }
      const slots = this.state.slots
      const index = slots.findIndex(i => i.slot === target)
      if (codeList.length) {
        const slotList = codeList.map(i => {
          const item = createCodeSlot()
          item.slot.insert(i)
          return item
        })
        slots.splice(index + 1, 0, ...slotList)
        const last = slotList[slotList.length - 1]
        selection.setPosition(last.slot, last.slot.length)
      } else {
        selection.setPosition(target, target.index)
      }
      ev.preventDefault()
    })

    onFocus(() => {
      this.focus.next(true)
    })

    onBlur(() => {
      this.focus.next(false)
    })

    const commander = useContext(Commander)
    useDynamicShortcut({
      keymap: {
        key: 'Tab'
      },
      action(): boolean | void {
        if (selection.isCollapsed) {
          commander.insert('  ')
          return
        }
        const blocks = selection.getBlocks()
        blocks.forEach(block => {
          block.slot.retain(0)
          block.slot.insert('  ')
        })
        selection.setBaseAndExtent(selection.anchorSlot!, selection.anchorOffset! + 2, selection.focusSlot!, selection.focusOffset! + 2)
      }
    })

    useDynamicShortcut({
      keymap: {
        key: 'Tab',
        shiftKey: true
      },
      action(): boolean | void {
        const blocks = selection.getBlocks()
        blocks.forEach(block => {
          if (block.slot.sliceContent(0, 2)[0] === '  ') {
            block.slot.retain(0)
            block.slot.delete(2)
            if (block.slot === selection.anchorSlot) {
              selection.setAnchor(block.slot, selection.anchorOffset! - 2)
            }
            if (block.slot === selection.focusSlot) {
              selection.setFocus(block.slot, selection.focusOffset! - 2)
            }
          }
        })
      }
    })
  }

  override removeSlot(slot: Slot) {
    const slots = this.state.slots
    const index = slots.findIndex(i => i.slot === slot)
    if (index > -1) {
      slots.splice(index, 1)
      return true
    }
    return false
  }

  cancelEmphasize = () => {
    const selection = this.textbus!.get(Selection)
    const slots = this.state.slots
    const { startSlot, endSlot } = selection
    let startIndex = slots.findIndex(i => i.slot === startSlot!)
    const endIndex = slots.findIndex(i => i.slot === endSlot!) + 1
    for (; startIndex < endIndex; startIndex++) {
      slots[startIndex].emphasize = false
    }
  }

  emphasize = () => {
    const selection = this.textbus!.get(Selection)
    const slots = this.state.slots
    const { startSlot, endSlot } = selection
    let startIndex = slots.findIndex(i => i.slot === startSlot!)
    const endIndex = slots.findIndex(i => i.slot === endSlot!) + 1
    for (; startIndex < endIndex; startIndex++) {
      slots[startIndex].emphasize = true
    }
  }
}

export function SourceCodeView(props: ViewComponentProps<SourceCodeComponent>) {
  const adapter = inject(DomAdapter)
  const i18n = inject(I18nService)
  const isFocus = createSignal(false)
  const subscription = props.component.focus.subscribe(b => {
    isFocus.set(b)
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const state = props.component.state

  function changeLang(lang: string) {
    state.lang = lang
  }

  function changeTheme(theme: string) {
    state.theme = theme
  }

  function setting(v: string) {
    switch (v) {
      case 'lineNumber':
        state.lineNumber = !state.lineNumber
        break
      case 'autoBreak':
        state.autoBreak = !state.autoBreak
        break
    }
  }

  const readonly = useReadonly()
  const output = useOutput()
  return () => {
    const state = props.component.state
    const slots = state.slots

    let lang = ''
    languageList.forEach(i => {
      if (i.value === state.lang) {
        lang = i.label
      }
    })
    const blockHighlight = slots.some(i => i.emphasize)
    const results: DocumentFragment[] = []

    if (state.lang) {
      const str = slots.map(item => {
        const slot = item.slot
        return (slot.isEmpty ? '' : slot.toString()) + '\n'
      }).join('')
      const highlightResult = highlightjs.highlight(state.lang, str)

      const dom = new DOMParser().parseFromString(highlightResult.value.replace(/\n/g, '<br>'), 'text/html').body

      const range = new Range()
      range.selectNodeContents(dom)

      const brs = Array.from(dom.querySelectorAll('br'))

      while (brs.length) {
        const br = brs.shift()!
        range.setEndBefore(br)
        results.push(range.extractContents())
        range.setStartAfter(br)
        if (!brs.length) {
          range.selectNodeContents(dom)
          range.setStartAfter(br)
          results.push(range.extractContents())
        }
      }
    }

    return (
      <div ref={props.rootRef} class={{
        'xnote-source-code': true,
        'xnote-source-code-line-number': state.lineNumber,
        [`xnote-theme-${state.theme || 'github'}`]: true
      }}
           data-lang={state.lang}
           data-component={props.component.name}
           data-auto-break={state.autoBreak + ''}
           data-theme={state.theme || null}
           data-line-number={state.lineNumber + ''}
      >
        {
          (!readonly() && !output()) &&
          <div class="xnote-source-code-toolbar">
            <Popover noPadding={true}
                     flip={false}
                     showArrow={false}
                     placement={'top-start'}
                     open={isFocus()}
                     style={{
                       padding: '3px 6px'
                     }} content={
              <div class="xnote-source-code-toolbar-row">
                <Dropdown trigger={'hover'} dropdown={
                  <MenuList style={{ width: '140px' }} columnCompact={true}>
                    {
                      languageList.map(item => {
                        return (
                          <MenuItem density={'compact'} onClick={() => changeLang(item.value)}>
                            <div class="xnote-flex-between">
                              {item.label || 'Plain Text'}
                              <span class="xnote-flex-center">
                              {state.lang === item.value && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
                            </span>
                            </div>
                          </MenuItem>
                        )
                      })
                    }
                  </MenuList>
                }>
                  <Button size={'small'} variant={'text'}>{lang || 'Plain Text'}</Button>
                </Dropdown>

                <span>{i18n.t('sourceCode.theme')}</span>
                <Dropdown trigger={'hover'} dropdown={
                  <MenuList style={{ width: '160px' }} columnCompact={true}>
                    {
                      sourceCodeThemes.map(item => {
                        return (
                          <MenuItem density={'compact'} onClick={() => changeTheme(item)}>
                            <div class="xnote-flex-between">
                              {item}
                              <span class="xnote-flex-center">
                              {state.theme === item && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
                            </span>
                            </div>
                          </MenuItem>
                        )
                      })
                    }
                  </MenuList>
                }>
                  <Button variant={'text'} size={'small'}>{state.theme || 'github'}</Button>
                </Dropdown>
                <Dropdown trigger={'hover'} dropdown={
                  <MenuList style={{
                    width: '150px'
                  }} columnCompact={true}>
                    <MenuItem density={'compact'} icon={<IconGlyph name={'list-numbered'}/>} onClick={() => {
                      setting('lineNumber')
                    }}>
                      <div class="xnote-flex-between">
                        {i18n.t('sourceCode.lineNumber')}
                        <span class="xnote-flex-center">
                        {state.lineNumber && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
                      </span>
                      </div>
                    </MenuItem>
                    <MenuItem density={'compact'} icon={<IconGlyph name={'text-wrap'}/>} onClick={() => {
                      setting('autoBreak')
                    }}>
                      <div class="xnote-flex-between">
                        {i18n.t('sourceCode.wordWrap')}
                        <span class="xnote-flex-center">
                        {state.autoBreak && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
                      </span>
                      </div>
                    </MenuItem>
                  </MenuList>
                }>
                  <Button size={'small'} variant={'text'}>{i18n.t('sourceCode.settings')}</Button>
                </Dropdown>
                <Button size={'small'} variant={'text'} onClick={props.component.emphasize}>{i18n.t('sourceCode.emphasize')}</Button>
                <Button size={'small'} variant={'text'}
                        onClick={props.component.cancelEmphasize}>{i18n.t('sourceCode.cancelEmphasize')}</Button>
              </div>
            }>
            </Popover>
          </div>
        }
        <div class={[
          'xnote-source-code-container',
          {
            'hljs': true,
            'xnote-source-code-auto-break': state.autoBreak
          }
        ]}>
          <div class="xnote-source-code-line-number-bg" style={{
            width: Math.max(String(slots.length).length, 2.5) + 'em'
          }}/>
          <pre class={{
            'xnote-source-code-content': true,
            'xnote-source-code-content-highlight': blockHighlight
          }} style={{
            'padding-left': Math.max(String(slots.length).length, 2.5) + 'em',
            'margin-left': -Math.max(String(slots.length).length, 2.5) + 'em'
          }}>
            {
              slots.map(item => {
                return adapter.slotRender(item.slot, (children) => {
                  if (state.lang) {
                    const nodes = Array.from(results.shift()!.childNodes)
                    const oldChildren = children
                    let newChildren: typeof children | null = null
                    let insertIndex = 0
                    for (const v of oldChildren) {
                      if (v instanceof Decorator) {
                        newChildren = nodesToVNodes(item.slot, nodes, 0, {
                          index: insertIndex,
                          decorator: v
                        })
                        break
                      } else if (v instanceof Component) {
                        insertIndex++
                      } else if (v.location) {
                        insertIndex = v.location.endIndex
                      }
                    }
                    if (!newChildren) {
                      newChildren = nodesToVNodes(item.slot, nodes, 0)
                    }
                    if (!newChildren.length) {
                      const br = createVNode('br')
                      br.location = {
                        slot: item.slot,
                        startIndex: 0,
                        endIndex: 1
                      }
                      newChildren.push(br)
                    }
                    children = newChildren
                  }
                  return createVNode('div', {
                    class: 'xnote-source-code-line' + (item.emphasize ? ' xnote-source-code-line-emphasize' : ''),
                    key: item.slot.id
                  }, [
                    createVNode('span', { class: 'xnote-source-code-line-content' }, children)
                  ])
                }, readonly())
              })
            }
          </pre>
          <span class="xnote-source-code-lang">{lang}</span>
        </div>
      </div>
    )
  }
}

function nodesToVNodes(slot: Slot,
                       nodes: Node[],
                       index: number,
                       inputDecorator?: { decorator: Decorator, index: number }) {
  const newNodes: Array<VElement | VTextNode | Decorator> = []
  if (inputDecorator && inputDecorator.index === 0) {
    newNodes.push(inputDecorator.decorator)
    inputDecorator = undefined
  }
  nodes.forEach(i => {
    const location = {
      slot,
      startIndex: index,
      endIndex: index + i.textContent!.length
    }
    if (i.nodeType === Node.ELEMENT_NODE) {
      const childNodes = Array.from(i.childNodes)
      const vEle = createVNode('span', {
        class: (i as HTMLElement).className
      }, nodesToVNodes(slot, childNodes, index, inputDecorator))
      index = location.endIndex
      vEle.location = location
      newNodes.push(vEle)
      return
    }
    index = location.endIndex

    if (inputDecorator) {
      if (inputDecorator.index === location.endIndex) {
        const textNode = new VTextNode(i.textContent!)
        textNode.location = location
        newNodes.push(textNode)
        newNodes.push(inputDecorator.decorator)
        return
      }
      if (inputDecorator.index > location.startIndex && inputDecorator.index < location.endIndex) {
        const beforeTextNode = new VTextNode(i.textContent!.slice(0, inputDecorator.index - location.startIndex))
        const afterTextNode = new VTextNode(i.textContent!.slice(inputDecorator.index - location.startIndex))
        beforeTextNode.location = {
          slot,
          startIndex: location.startIndex,
          endIndex: inputDecorator.index,
        }
        afterTextNode.location = {
          slot,
          startIndex: inputDecorator.index,
          endIndex: location.endIndex,
        }
        newNodes.push(beforeTextNode, inputDecorator.decorator, afterTextNode)
        return
      }
    }
    const textNode = new VTextNode(i.textContent!)
    textNode.location = location
    newNodes.push(textNode)
  })

  return newNodes
}

export const sourceCodeComponentLoader: ComponentLoader = {
  match(element: HTMLElement, returnableContentTypes): boolean {
    return returnableContentTypes.includes(ContentType.BlockComponent) &&
      ((element.tagName === 'DIV' && element.dataset.component === SourceCodeComponent.componentName) ||
        element.tagName === 'PRE')
  },
  read(el: HTMLElement) {
    let slots: CodeSlotState[] = []
    if (el.tagName === 'DIV') {
      const lines = el.querySelectorAll('.xnote-source-code-line')
      slots = Array.from(lines).map(i => {
        const code = (i as HTMLElement).innerText.replace(/[\s\n]+$/, '')
        const item = createCodeSlot()
        const slot = item.slot
        item.emphasize = i.classList.contains('xnote-source-code-line-emphasize')
        slot.insert(code)
        return item
      })
    } else {
      el.querySelectorAll('br').forEach(br => {
        br.parentNode!.replaceChild(document.createTextNode('\n'), br)
      })
      slots = el.innerText.split('\n').map(code => {
        const item = createCodeSlot()
        item.slot.insert(code)
        return item
      })
    }

    return new SourceCodeComponent({
      lang: el.dataset.lang || '',
      theme: el.dataset.theme || '',
      lineNumber: el.dataset.lineNumber === 'true',
      autoBreak: el.dataset.autoBreak === 'true',
      slots
    })
  },
}
