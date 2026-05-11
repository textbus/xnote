import {
  Component,
  ComponentStateLiteral,
  ContentType, fromEvent,
  Slot,
  Textbus,
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { createDynamicRef, createSignal, inject, jsx, JSXNode } from '@viewfly/core'
import { ComponentLoader } from '@textbus/platform-browser'
import Mermaid from 'mermaid'
import { Dropdown } from '@viewfly/ui-components'

import './mermaid.component.scss'
import { MermaidEditor } from './mermaid-editor'
import { useOutput } from '../../hooks/use-output'
import { useReadonly } from '../../hooks/use-readonly'

export interface MermaidComponentState {
  text: string
}

export class MermaidComponent extends Component<MermaidComponentState> {
  static componentName = 'MermaidComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, state: ComponentStateLiteral<MermaidComponentState>) {
    return new MermaidComponent(state)
  }


  constructor(state: MermaidComponentState = {
    text: ''
  }) {
    super(state)
  }

  override getSlots(): Slot[] {
    return []
  }
}

export function MermaidComponentView(props: ViewComponentProps<MermaidComponent>) {

  const svgDom = createSignal<HTMLElement | null>(null)

  props.component.changeMarker.onChange.subscribe(() => {
    render()
  })

  function render() {
    Mermaid.render('test', props.component.state.text).then(result => {
      const svg = result.svg
      const dom = new DOMParser().parseFromString(svg, 'text/html').body.children[0] as HTMLElement
      svgDom.set(dom)
    }).catch(error => {
      const html = document.createElement('div')
      html.className = 'xnote-mermaid-error'
      html.innerHTML = error.message
      svgDom.set(html)
    })
  }

  if (props.component.state.text) {
    render()
  }

  function domToVDom(el: HTMLElement | null): JSXNode {
    if (!el) {
      return jsx('span', {
        class: 'xnote-mermaid-empty',
        children: [props.component.state.text ? '' : '空 Mermaid 图表']
      })
    }
    const attrs: {[key: string]: any} = {}
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

  const selection = inject(Textbus)
  const editorRef = createDynamicRef<HTMLElement>(node => {
    const editor = new MermaidEditor()

    editor.mount(node, props.component.state.text).then(() => {
      editor.focus()
    })
    selection.blur()

    const subscription = editor.onValueChange.subscribe((value) => {
      props.component.state.text = value
    }).add(
      fromEvent(node, 'mousedown').subscribe(ev => ev.stopPropagation()),
      // fromEvent(document, 'mousedown').subscribe(() => {
      //   dropdownRef.value?.isShow(false)
      // })
    )

    return () => {
      subscription.unsubscribe()
      editor.destroy()
    }
  })

  const output = useOutput()
  const readonly = useReadonly()
  return () => {
    const text = props.component.state.text
    return (
      <div ref={props.rootRef} data-component={MermaidComponent.componentName} data-mermaid={encodeURIComponent(text)}
           class="xnote-mermaid">
        {
          (output() || readonly()) ?
            domToVDom(svgDom())
            :
            <Dropdown block dropdown={
              <div class="xnote-mermaid-input" ref={editorRef}>
              </div>
            }>
              <div class="xnote-mermaid-content">
                {domToVDom(svgDom())}
              </div>
            </Dropdown>
        }
      </div>
    )
  }
}

export const mermaidComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.component === MermaidComponent.componentName
  },
  read(element: HTMLElement): Component | Slot | void {
    const value = element.dataset.mermaid || ''
    return new MermaidComponent({
      text: decodeURIComponent(value)
    })
  }
}
