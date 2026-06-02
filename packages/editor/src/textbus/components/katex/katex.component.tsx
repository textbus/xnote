import {
  Component,
  ComponentStateLiteral,
  ContentType,
  Slot,
  Textbus,
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject, jsx, JSXNode } from '@viewfly/core'
import { ComponentLoader, isMobileBrowser } from '@textbus/platform-browser'
// @ts-ignore
import Katex from 'katex'
import { Dropdown } from '@viewfly/ui-components'

import './katex.component.scss'
import { useOutput } from '../../hooks/use-output'
import { useReadonly } from '../../hooks/use-readonly'
import { I18nService } from '../../../services/i18n.service'
import { SourceCodeEditor } from '../_common/source-code-editor'

export interface KatexComponentState {
  text: string
}

export class KatexComponent extends Component<KatexComponentState> {
  static componentName = 'KatexComponent'
  static type = ContentType.InlineComponent

  static fromJSON(textbus: Textbus, state: ComponentStateLiteral<KatexComponentState>) {
    return new KatexComponent(state)
  }


  constructor(state: KatexComponentState = {
    text: '% \\f is defined as #1f(#2) using the macro\n' +
      '\\f\\relax{x} = \\int_{-\\infty}^\\infty\n' +
      '\\f\\hat\\xi\\,e^{2 \\pi i \\xi x}\n' +
      '\\,d\\xi'
  }) {
    super(state)
  }

  override getSlots(): Slot[] {
    return []
  }
}

function domToVDom(el: HTMLElement): JSXNode {
  const attrs: { [key: string]: any } = {}
  el.getAttributeNames().forEach(key => {
    attrs[key] = el.getAttribute(key)!
  })
  attrs.children = Array.from(el.childNodes).map(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      return domToVDom(child as HTMLElement)
    }
    return child.textContent || ''
  })

  return jsx(el.tagName.toLowerCase(), attrs)
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

export function KatexComponentView(props: ViewComponentProps<KatexComponent>) {
  const i18n = inject(I18nService)

  function toDOM(value: string) {
    let htmlString: string
    try {
      htmlString = Katex.renderToString(value, {
        displayMode: true,
        leqno: false,
        fleqn: false,
        throwOnError: true,
        errorColor: '#cc0000',
        strict: 'warn',
        output: 'html',
        trust: false,
        macros: { '\\f': '#1f(#2)' }
      })
    } catch (e) {
      htmlString = '<span style="color: red">' + escapeHtml(i18n.t('katex.formulaError')) + '</span>'
    }
    return new DOMParser().parseFromString(htmlString, 'text/html').body.children[0] as HTMLElement
  }

  const textbus = inject(Textbus)

  function onChange(text: string) {
    props.component.state.text = text
  }

  function onReady() {
    textbus.blur()
  }

  const output = useOutput()
  const readonly = useReadonly()
  return () => {
    const text = props.component.state.text
    return (
      <span ref={props.rootRef} data-component={KatexComponent.componentName} data-katex={encodeURIComponent(text)} class="xnote-katex">
       {
         (output() || readonly()) ?
           domToVDom(toDOM(text))
           :
           <Dropdown dropdown={
             <SourceCodeEditor i18n={i18n}
                               sourceCode={text}
                               language={'latex'}
                               onReady={onReady}
                               helpLink={'https://katex.org/docs/supported'}
                               onChange={onChange}/>
           }>
             {isMobileBrowser() ? <span contenteditable={false}>{domToVDom(toDOM(text))}</span> : domToVDom(toDOM(text))}
           </Dropdown>
       }
      </span>
    )
  }
}

export const katexComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.component === KatexComponent.componentName
  },
  read(element: HTMLElement): Component | Slot | void {
    const value = element.dataset.katex || ''
    return new KatexComponent({
      text: decodeURIComponent(value)
    })
  }
}
