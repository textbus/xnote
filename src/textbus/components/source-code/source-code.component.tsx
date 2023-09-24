import {
  BehaviorSubject,
  ComponentInitData,
  ComponentInstance,
  ContentType,
  createVNode,
  defineComponent,
  ExtractComponentInstanceType,
  onBlur,
  onBreak, onFocus,
  onPaste,
  Selection,
  Slot,
  Textbus,
  useContext,
  useSelf,
  VTextNode,
} from '@textbus/core'
import { ComponentLoader, DomAdapter, Input } from '@textbus/platform-browser'
import highlightjs from 'highlight.js'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, onUnmounted, createSignal } from '@viewfly/core'

import './source-code.component.scss'
import { paragraphComponent } from '../paragraph/paragraph.component'
import { ComponentToolbar } from '../../../components/component-toolbar/component-toolbar'
import { ToolbarItem } from '../../../components/toolbar-item/toolbar-item'
import { Button } from '../../../components/button/button'
import { Dropdown } from '../../../components/dropdown/dropdown'
import { MenuItem } from '../../../components/menu-item/menu-item'

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
  label: '',
  value: '',
}]

export const sourceCodeThemes = [
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
}

export interface CodeSlotState {
  emphasize: boolean
}

export function createCodeSlot() {
  return new Slot<CodeSlotState>([
    ContentType.Text
  ], {
    emphasize: false
  })
}

export const sourceCodeComponent = defineComponent({
  type: ContentType.BlockComponent,
  name: 'SourceCodeComponent',
  separable: false,
  zenCoding: {
    key: 'Enter',
    match(c: string) {
      const matchString = languageList.map(i => i.label || i.value).concat('js', 'ts').join('|').replace(/\+/, '\\+')
      const reg = new RegExp(`^\`\`\`(${matchString})$`, 'i')
      return reg.test(c)
    },
    generateInitData(content) {
      const matchString = content.replace(/`/g, '').replace(/\+/, '\\+')
      for (const item of languageList) {
        const reg = new RegExp(`^${matchString}$`, 'i')
        if (reg.test(item.label || item.value)) {
          return {
            state: {
              lang: item.value,
              theme: ''
            },
            slots: [createCodeSlot()]
          }
        }
      }
      if (/^js$/i.test(matchString)) {
        return {
          state: {
            lang: 'JavaScript',
            theme: ''
          },
          slots: [createCodeSlot()]
        }
      }
      if (/^ts$/i.test(matchString)) {
        return {
          state: {
            lang: 'TypeScript',
            theme: ''
          },
          slots: [createCodeSlot()]
        }
      }
      return {
        state: {
          lang: '',
          theme: ''
        },
        slots: [createCodeSlot()]
      }
    }
  },
  validate(_, data: ComponentInitData<SourceCodeComponentState, CodeSlotState> = {
    slots: [],
    state: {
      lang: '',
      theme: ''
    }
  }) {
    const state = {
      lang: data.state!.lang,
      theme: data.state?.theme || 'github',
      lineNumber: data.state?.lineNumber !== false
    }

    return {
      slots: data.slots?.length ? data.slots : [createCodeSlot()],
      state
    }
  },
  setup() {
    const self = useSelf<ExtractComponentInstanceType<typeof sourceCodeComponent>>()
    const slots = self.slots
    const textbus = useContext()

    const selection = useContext(Selection)

    onBreak(ev => {
      if (ev.target.isEmpty && ev.target === slots.last) {
        const prevSlot = slots.get(slots.length - 2)
        if (prevSlot?.isEmpty) {
          const paragraph = paragraphComponent.createInstance(textbus)
          const parentComponent = selection.commonAncestorComponent!
          const parentSlot = parentComponent.parent!
          const index = parentSlot.indexOf(parentComponent)
          parentSlot.retain(index + 1)
          slots.remove(slots.last)
          if (slots.length > 1) {
            slots.remove(prevSlot)
          }
          parentSlot.insert(paragraph)
          selection.setPosition(paragraph.slots.get(0)!, 0)
          ev.preventDefault()
          return
        }
      }
      const nextSlot = ev.target.cutTo(createCodeSlot(), ev.data.index)
      slots.insertAfter(nextSlot, ev.target as Slot)
      selection.setPosition(nextSlot, 0)
      ev.preventDefault()
    })

    function emphasize() {
      const { startSlot, endSlot } = selection
      let startIndex = slots.indexOf(startSlot!)
      const endIndex = slots.indexOf(endSlot!) + 1
      for (; startIndex < endIndex; startIndex++) {
        slots.get(startIndex)?.updateState(draft => {
          draft.emphasize = true
        })
      }
    }

    function cancelEmphasize() {
      const { startSlot, endSlot } = selection
      let startIndex = slots.indexOf(startSlot!)
      const endIndex = slots.indexOf(endSlot!) + 1
      for (; startIndex < endIndex; startIndex++) {
        slots.get(startIndex)?.updateState(draft => {
          draft.emphasize = false
        })
      }
    }

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
      const index = slots.indexOf(target)
      if (codeList.length) {
        slots.retain(index + 1)
        const slotList = codeList.map(i => {
          const slot = createCodeSlot()
          slot.insert(i)
          return slot
        })
        const last = slotList[slotList.length - 1]
        slots.insert(...slotList)
        selection.setPosition(last, last.length)
      } else {
        selection.setPosition(target, target.index)
      }
      ev.preventDefault()
    })

    const focus = new BehaviorSubject<boolean>(false)

    onFocus(() => {
      focus.next(true)
    })

    onBlur(() => {
      focus.next(false)
    })

    return {
      emphasize,
      cancelEmphasize,
      focus
    }
  }
})

export function SourceCode(props: ViewComponentProps<typeof sourceCodeComponent>) {
  const adapter = inject(DomAdapter)
  const isFocus = createSignal(false)
  const subscription = props.component.extends.focus.subscribe(b => {
    isFocus.set(b)
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  function changeLang(lang: string) {
    props.component.updateState(draft => {
      draft.lang = lang
    })
  }

  function changeTheme(theme: string) {
    props.component.updateState(draft => {
      draft.theme = theme
    })
  }

  function setting(v: string) {
    switch (v) {
      case 'lineNumber':
        props.component.updateState(draft => {
          draft.lineNumber = !props.component.state.lineNumber
        })
        break
      case 'autoBreak':
        props.component.updateState(draft => {
          draft.autoBreak = !props.component.state.autoBreak
        })
        break
    }
  }

  const input = inject(Input)

  function updateCaret() {
    if (props.component.extends.focus) {
      input.caret.refresh(false)
    }
  }

  return () => {
    const { state, slots } = props.component

    let lang = ''
    languageList.forEach(i => {
      if (i.value === state.lang) {
        lang = i.label
      }
    })
    const blockHighlight = slots.toArray().some(i => i.state?.emphasize === true)
    const results: DocumentFragment[] = []

    if (state.lang) {
      const str = slots.toArray().map(slot => {
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

    function nodesToVNodes(slot: Slot, nodes: Node[], index: number) {
      return nodes.map(i => {
        const location = {
          slot,
          startIndex: index,
          endIndex: index + i.textContent!.length
        }
        if (i.nodeType === Node.ELEMENT_NODE) {
          const childNodes = Array.from(i.childNodes)
          const vEle = createVNode('span', {
            class: (i as HTMLElement).className
          }, nodesToVNodes(slot, childNodes, index))
          index = location.endIndex

          vEle.location = { ...location }
          return vEle
        }
        index = location.endIndex

        const textNode = new VTextNode(i.textContent!)
        textNode.location = location
        return textNode
      })
    }


    return (
      <pre ref={props.rootRef} class={{
        'xnote-source-code': true,
        'xnote-source-code-line-number': state.lineNumber,
        [state.theme || 'github']: true
      }}
           lang={state.lang}
           data-auto-break={state.autoBreak}
           data-theme={state!.theme || null}
           data-line-number={state.lineNumber}
      >
        <ComponentToolbar visible={isFocus()}>
          <ToolbarItem>
            <Dropdown onCheck={changeLang} trigger={'hover'} menu={languageList.map(item => {
              return {
                label: <MenuItem checked={state.lang === item.value}>{item.label || 'Plain Text'}</MenuItem>,
                value: item.value
              }
            })}>
              <Button arrow={true}>{lang || 'Plain Text'}</Button>
            </Dropdown>
          </ToolbarItem>
          <ToolbarItem>
            主题：<Dropdown trigger={'hover'} onCheck={changeTheme} menu={sourceCodeThemes.map(item => {
            return {
              label: <MenuItem checked={state.theme === item}>{item}</MenuItem>,
              value: item
            }
          })}>
              <Button arrow={true}>{state.theme || 'github'}</Button>
            </Dropdown>
          </ToolbarItem>
          <ToolbarItem>
            <Dropdown onCheck={setting} menu={[
              {
                label: <MenuItem icon={<span class="xnote-icon-list-numbered"/>} checked={state.lineNumber}>行号</MenuItem>,
                value: 'lineNumber'
              }, {
                label: <MenuItem icon={<span class="xnote-icon-text-wrap"/>} checked={state.autoBreak}>自动换行</MenuItem>,
                value: 'autoBreak'
              }
            ]}>
              <Button arrow={true}>设置</Button>
            </Dropdown>
          </ToolbarItem>
          <ToolbarItem>
            <Button onClick={props.component.extends.emphasize}>强调</Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button onClick={props.component.extends.cancelEmphasize}>取消强调</Button>
          </ToolbarItem>
        </ComponentToolbar>
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
          <div onScroll={updateCaret} class={{
            'xnote-source-code-content': true,
            'xnote-source-code-content-highlight': blockHighlight
          }} style={{
            'padding-left': Math.max(String(slots.length).length, 2.5) + 'em',
            'margin-left': -Math.max(String(slots.length).length, 2.5) + 'em'
          }}>
            {
              slots.toArray().map(item => {
                return adapter.slotRender(item, (children) => {
                  if (state.lang) {
                    const nodes = Array.from(results.shift()!.childNodes)
                    children = nodesToVNodes(item, nodes, 0)
                    if (!children.length) {
                      const br = createVNode('br')
                      br.location = {
                        slot: item,
                        startIndex: 0,
                        endIndex: 1
                      }
                      children.push(br)
                    }
                  }
                  return createVNode('div', {
                    class: 'xnote-source-code-line' + (item.state?.emphasize ? ' xnote-source-code-line-emphasize' : '')
                  }, [
                    createVNode('div', { class: 'xnote-source-code-line-content' }, children)
                  ])
                }, false)
              })
            }
          </div>
          <span class="xnote-source-code-lang">{lang}</span>
        </div>
      </pre>
    )
  }
}

export const sourceCodeComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'PRE'
  },
  read(el: HTMLElement, textbus: Textbus): ComponentInstance {
    const lines = el.querySelectorAll('.xnote-source-code-line')
    let slots: Slot[] = []
    if (lines.length) {
      slots = Array.from(lines).map(i => {
        const code = (i as HTMLElement).innerText.replace(/[\s\n]+$/, '')
        const slot = createCodeSlot()
        slot.updateState(draft => {
          draft.emphasize = i.classList.contains('xnote-source-code-line-emphasize')
        })
        slot.insert(code)
        return slot
      })
    } else {
      el.querySelectorAll('br').forEach(br => {
        br.parentNode!.replaceChild(document.createTextNode('\n'), br)
      })
      slots = el.innerText.split('\n').map(code => {
        const slot = createCodeSlot()
        slot.insert(code)
        return slot
      })
    }

    return sourceCodeComponent.createInstance(textbus, {
      state: {
        lang: el.getAttribute('lang') || '',
        theme: el.getAttribute('theme') || '',
        lineNumber: !el.classList.contains('xnote-source-code-hide-line-number')
      },
      slots
    })
  },
}
