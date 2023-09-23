import {
  BehaviorSubject,
  ComponentInitData,
  ComponentInstance,
  ContentType, createVNode,
  defineComponent,
  ExtractComponentInstanceType,
  Formatter, onBlur,
  onBreak, onFocus,
  onPaste,
  Selection,
  Slot,
  Slots, Textbus,
  useContext,
  useDynamicShortcut,
  useSelf,
  VElement,
  VTextNode,
} from '@textbus/core'
import { ComponentLoader, DomAdapter } from '@textbus/platform-browser'
import { Grammar, languages, Token, tokenize } from 'prismjs'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, onUnmounted, useSignal } from '@viewfly/core'

import './source-code.component.scss'
import { paragraphComponent } from '../paragraph/paragraph.component'
import { ComponentToolbar } from '../../../components/component-toolbar/component-toolbar'
import { ToolbarItem } from '../../../components/toolbar-item/toolbar-item'
import { Button } from '../../../components/button/button'
import { Dropdown } from '../../../components/dropdown/dropdown'
import { MenuItem } from '../../../components/menu-item/menu-item'

export const codeStyles = {
  keyword: 'keyword',
  string: 'string',
  function: 'function',
  number: 'number',
  tag: 'tag',
  comment: 'comment',
  boolean: 'boolean',
  operator: false,
  builtin: 'builtin',
  punctuation: false,
  regex: 'regex',
  selector: 'selector',
  property: 'attr-name',
  'class-name': 'class-name',
  'attr-name': 'attr-name',
  'attr-value': 'attr-value',
  'template-punctuation': 'string',
}

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
  label: 'Jsx',
  value: 'Jsx',
}, {
  label: 'Tsx',
  value: 'Tsx',
}, {
  label: '',
  value: '',
}]

export interface SourceCodeComponentState {
  lang: string
  theme?: string
  lineNumber?: boolean
}

export class CodeStyleFormatter implements Formatter<string> {
  name = 'code' + Math.random()
  columned = false

  render(children: Array<VElement | VTextNode>, formatValue: string) {
    return new VElement('span', {
      class: 'tb-hl-' + formatValue
    }, children)
  }
}

export const codeStyleFormatter = new CodeStyleFormatter()

function getLanguageBlockCommentStart(lang: string): [string, string] {
  const types: Record<string, [string, string]> = {
    HTML: ['<!--', '-->'],
    JavaScript: ['/*', '*/'],
    CSS: ['/*', '*/'],
    TypeScript: ['/*', '*/'],
    Java: ['/*', '*/'],
    Swift: ['/*', '*/'],
    Go: ['/*', '*/'],
    JSON: ['', ''],
    Less: ['/*', '*/'],
    SCSS: ['/*', '*/'],
    Stylus: ['/*', '*/'],
    C: ['/*', '*/'],
    CPP: ['/*', '*/'],
    CSharp: ['/*', '*/'],
    Tsx: ['/*', '*/'],
    Jsx: ['/*', '*/']
  }
  return types[lang] || ['', '']
}

function getLanguageGrammar(lang: string): Grammar | null {
  return {
    HTML: languages.html,
    JavaScript: languages.javascript,
    CSS: languages.css,
    TypeScript: languages.typescript,
    Java: languages.java,
    Swift: languages.swift,
    JSON: languages.json,
    Go: languages.go,
    Ruby: languages.ruby,
    Less: languages.less,
    SCSS: languages.scss,
    Stylus: languages.stylus,
    C: languages.c,
    CPP: languages.cpp,
    CSharp: languages.csharp,
    Jsx: languages.jsx,
    Tsx: languages.tsx
  }[lang] || null
}

function format(tokens: Array<string | Token>, slot: Slot, index: number) {
  tokens.forEach(token => {
    if (token instanceof Token) {
      const styleName = codeStyles[token.type]
      slot.retain(index)
      slot.retain(token.length, codeStyleFormatter, styleName || null)
      if (Array.isArray(token.content)) {
        format(token.content, slot, index)
      }
    }
    index += token.length
  })
}

function formatCodeLines(
  lines: Array<{ emphasize: boolean, code: string }>,
  startBlock: boolean,
  blockCommentStartString: string,
  blockCommentEndString: string,
  languageGrammar: Grammar | null) {
  return lines.map(item => {
    let i = item.code
    const slot = createCodeSlot()
    slot.updateState(draft => {
      draft.blockCommentStart = startBlock
      draft.emphasize = item.emphasize
    })
    if (slot.state!.blockCommentStart) {
      i = blockCommentStartString + i
    }
    slot.insert(i)
    if (languageGrammar) {
      const tokens = tokenize(i, languageGrammar)
      format(tokens, slot, 0)
      if (slot.state!.blockCommentStart) {
        slot.retain(0)
        slot.delete(2)
      }
      const lastToken = tokens.pop()

      if (lastToken && typeof lastToken !== 'string' &&
        lastToken.type === 'comment' &&
        (lastToken.content as string).indexOf(blockCommentStartString) === 0) {
        const regString = blockCommentEndString.replace(new RegExp(`[${blockCommentEndString}]`, 'g'), i => '\\' + i)
        slot.updateState(draft => {
          draft.blockCommentEnd = new RegExp(regString + '$').test(lastToken.content as string)
        })
        startBlock = !slot.state!.blockCommentEnd
      } else {
        startBlock = false
      }

      // startBlock = !!lastToken && typeof lastToken !== 'string' &&
      //   lastToken.type === 'comment' &&
      //   (lastToken.content as string).indexOf(blockCommentStartString) === 0
      // slot.blockCommentEnd = !startBlock
    } else {
      slot.updateState(draft => {
        draft.blockCommentEnd = true
      })
    }
    return slot
  })
}

function reformat(
  slots: Slots,
  startSlot: Slot,
  languageGrammar: Grammar,
  blockCommentStartString: string,
  blockCommentEndString: string,
  forceFormat = false) {
  const list = slots.toArray()
  let i = list.indexOf(startSlot)
  // if (list[0]) {
  //   list[0].blockCommentStart = startSlot.blockCommentEnd
  // }
  for (; i < list.length; i++) {
    const slot = list[i]
    let code = slot.sliceContent()[0] as string
    if (slot.state.blockCommentStart) {
      code = blockCommentStartString + code
    }

    const shadow = new Slot([ContentType.Text])
    shadow.insert(code)
    const tokens = tokenize(code, languageGrammar)
    format(tokens, shadow, 0)
    if (slot.state.blockCommentStart) {
      shadow.retain(0)
      shadow.delete(2)
    }

    slot.retain(0)
    slot.retain(slot.length, codeStyleFormatter, null)

    shadow.getFormats().forEach(i => {
      slot.retain(i.startIndex)
      slot.retain(i.endIndex - i.startIndex, i.formatter, i.value)
    })

    const lastToken = tokens.pop()
    if (lastToken && typeof lastToken !== 'string' &&
      lastToken.type === 'comment' &&
      (lastToken.content as string).indexOf(blockCommentStartString) === 0) {
      const regString = blockCommentEndString.replace(new RegExp(`[${blockCommentEndString}]`, 'g'), i => '\\' + i)
      slot.updateState(draft => {
        draft.blockCommentEnd = new RegExp(regString + '$').test(lastToken.content as string)
      })
    } else {
      slot.updateState(draft => {
        draft.blockCommentEnd = true
      })
    }

    const next = list[i + 1]
    if (next) {
      if (!forceFormat && next.state.blockCommentStart === !slot.state.blockCommentEnd) {
        break
      }
      next.updateState(draft => {
        draft.blockCommentStart = !slot.state.blockCommentEnd
      })
    }
  }
}

export interface CodeSlotState {
  blockCommentEnd: boolean
  blockCommentStart: boolean
  emphasize: boolean
}

export function createCodeSlot() {
  return new Slot<CodeSlotState>([
    ContentType.Text
  ], {
    blockCommentEnd: true,
    blockCommentStart: false,
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
  validate(data: ComponentInitData<SourceCodeComponentState, CodeSlotState> = {
    slots: [],
    state: {
      lang: '',
      theme: ''
    }
  }) {
    const state = {
      lang: data.state!.lang,
      theme: data.state?.theme || 'Light',
      lineNumber: data.state?.lineNumber !== false
    }
    const languageGrammar = getLanguageGrammar(state.lang)
    const [blockCommentStartString, blockCommentEndString] = getLanguageBlockCommentStart(state.lang)
    const codeConfig = (data.slots || [createCodeSlot()]).map(i => {
      return {
        emphasize: i.state?.emphasize || false,
        code: i.toString()
      }
    })
    const slotList = formatCodeLines(
      codeConfig,
      false,
      blockCommentStartString,
      blockCommentEndString,
      languageGrammar
    )

    return {
      slots: slotList,
      state
    }

  },
  setup() {
    const self = useSelf<ExtractComponentInstanceType<typeof sourceCodeComponent>>()
    self.onStateChange.subscribe(() => {
      languageGrammar = getLanguageGrammar(self.state.lang);

      [blockCommentStartString, blockCommentEndString] = getLanguageBlockCommentStart(self.state.lang)
      isStop = true
      slots.toArray().forEach(i => {
        i.updateState(draft => {
          draft.blockCommentStart = false
          draft.blockCommentEnd = false
        })
      })
      if (!languageGrammar) {
        slots.toArray().forEach(i => {
          i.retain(0)
          i.retain(i.length, codeStyleFormatter, null)
        })
      } else {
        reformat(slots, slots.get(0)!, languageGrammar!, blockCommentStartString, blockCommentEndString, true)
      }
      isStop = false
    })
    let languageGrammar = getLanguageGrammar(self.state.lang)
    let [blockCommentStartString, blockCommentEndString] = getLanguageBlockCommentStart(self.state.lang)

    const textbus = useContext()

    const selection = useContext(Selection)

    let isStop = false
    const slots = self.slots

    slots.onChildSlotChange.subscribe(slot => {
      if (languageGrammar && !isStop) {
        isStop = true
        const index = slot.index
        reformat(slots, slot, languageGrammar, blockCommentStartString, blockCommentEndString)
        slot.retain(index)
        isStop = false
      }
    })

    useDynamicShortcut({
      keymap: {
        key: '/',
        ctrlKey: true
      },
      action: () => {
        const startIndex = slots.indexOf(selection.startSlot!)
        const endIndex = slots.indexOf(selection.endSlot!)

        const selectedSlots = slots.slice(startIndex, endIndex + 1)
        const isAllComment = selectedSlots.every(f => {
          return /^\s*\/\//.test(f.toString())
        })
        if (isAllComment) {
          selectedSlots.forEach(f => {
            const code = f.toString()
            const index = code.indexOf('// ')
            const index2 = code.indexOf('//')

            if (index >= 0) {
              f.cut(index, index + 3)
              if (f === selection.anchorSlot) {
                selection.setAnchor(f, selection.startOffset! - 3)
              }
              if (f === selection.focusSlot) {
                selection.setFocus(f, selection.endOffset! - 3)
              }
            } else {
              f.cut(index2, index2 + 2)
              if (f === selection.anchorSlot) {
                selection.setAnchor(f, selection.startOffset! - 2)
              }
              if (f === selection.focusSlot) {
                selection.setFocus(f, selection.endOffset! - 2)
              }
            }
          })
        } else {
          selectedSlots.forEach(f => {
            f.retain(0)
            f.insert('// ')
          })
          selection.setBaseAndExtent(selection.startSlot!, selection.startOffset! + 3, selection.endSlot!, selection.endOffset! + 3)
        }
      }
    })

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
      if (languageGrammar && !isStop) {
        isStop = true
        const index = nextSlot.index
        reformat(slots, nextSlot, languageGrammar, blockCommentStartString, blockCommentEndString)
        nextSlot.retain(index)
        isStop = false
      }
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
        const slotList = formatCodeLines(
          codeList.map(i => {
            return {
              code: i,
              emphasize: false
            }
          }),
          !target.state.blockCommentEnd,
          blockCommentStartString,
          blockCommentEndString,
          languageGrammar
        )
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
  const isFocus = useSignal(false)
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

  function toggleLineNumber() {
    props.component.updateState(draft => {
      draft.lineNumber = !props.component.state.lineNumber
    })
  }

  return () => {
    const { state, slots } = props.component
    const blockHighlight = slots.toArray().some(i => i.state?.emphasize === true)
    return (
      <pre ref={props.rootRef} class={{
        'xnote-source-code': true,
        'xnote-source-code-hide-line-number': !state.lineNumber
      }}
           lang={state.lang}
           data-theme={state!.theme || null}
           data-line-number={state.lineNumber}
      >
        <ComponentToolbar visible={isFocus()}>
          <ToolbarItem>
            <Dropdown onCheck={changeLang} trigger={'hover'} menu={languageList.map(item => {
              return {
                label: <MenuItem>{item.label || 'Plain Text'}</MenuItem>,
                value: item.value
              }
            })}>
              <Button arrow={true}>{state.lang || 'Plain Text'}</Button>
            </Dropdown>
          </ToolbarItem>
          <ToolbarItem>
            主题：<Dropdown trigger={'hover'} onCheck={changeTheme} menu={[{
              label: 'Light',
              value: 'light'
            }, {
              label: 'Vitality',
              value: 'vitality'
            }, {
              label: 'Dark',
              value: 'dark'
            }, {
              label: 'Starry',
              value: 'starry'
            }].map(item => {
              return {
                label: <MenuItem>{item.label}</MenuItem>,
                value: item.value
              }
          })}>
              <Button arrow={true}>{state.theme || 'light'}</Button>
            </Dropdown>
          </ToolbarItem>
          <ToolbarItem>
            行号：<Button onClick={toggleLineNumber}><span class={state.lineNumber ? 'xnote-icon-checkbox-checked' : 'xnote-icon-checkbox-unchecked'}></span></Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button>强调</Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button>取消强调</Button>
          </ToolbarItem>
        </ComponentToolbar>
        <div class="xnote-source-code-container">
          <div class="xnote-source-code-line-number-bg" style={{
            width: Math.max(String(slots.length).length, 2.5) + 'em'
          }}/>
          <div class={{
            'xnote-source-code-content': true,
            'xnote-source-code-content-highlight': blockHighlight
          }}>
            {
              slots.toArray().map(item => {
                return adapter.slotRender(item, children => {
                  return createVNode('div', {
                    class: 'xnote-source-code-line' + (item.state?.emphasize ? ' xnote-source-code-line-emphasize' : '')
                  }, children)
                }, false)
              })
            }
          </div>
          <span class="xnote-source-code-lang">{state.lang}</span>
        </div>
      </pre>
    )
  }
}

export const preComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'PRE'
  },
  read(el: HTMLElement, textbus: Textbus): ComponentInstance {
    const lines = el.querySelectorAll('.tb-code-line')
    let slots: Slot[] = []
    if (lines.length) {
      slots = Array.from(lines).map(i => {
        const code = (i as HTMLElement).innerText.replace(/[\s\n]+$/, '')
        const slot = createCodeSlot()
        slot.updateState(draft => {
          draft.emphasize = i.classList.contains('tb-code-line-emphasize')
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
        lineNumber: !el.classList.contains('tb-pre-hide-line-number')
      },
      slots
    })
  },
}
