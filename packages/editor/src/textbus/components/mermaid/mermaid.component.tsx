import {
  Component,
  ComponentStateLiteral,
  ContentType,
  Slot,
  Textbus,
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { createSignal, inject, jsx, JSXNode } from '@viewfly/core'
import { ComponentLoader } from '@textbus/platform-browser'
import Mermaid from 'mermaid'
import { Dropdown } from '@viewfly/ui-components'

import './mermaid.component.scss'
import { useOutput } from '../../hooks/use-output'
import { useReadonly } from '../../hooks/use-readonly'
import { I18nService } from '../../../services/i18n.service'
import { SourceCodeEditor } from '../_common/source-code-editor'

const SVG_NS = 'http://www.w3.org/2000/svg'
const MATHML_NS = 'http://www.w3.org/1998/Math/MathML'
/** @see https://mermaid.js.org/intro/ */
const MERMAID_DOC_URL = 'https://mermaid.js.org/intro/'

/**
 * `DOMParser` + `text/html` 解析出的 SVG/MathML 节点，`tagName` 常为全小写；
 * Viewfly 的 `DomRenderer.getNameSpace` 对 `foreignObject` 等须精确匹配驼峰，否则子树命名空间错误。
 * 未列出的标签：退回 `tagName`（多数单段小写名如 `path`、`g` 与 JSX 一致）。
 */
const DOM_TO_JSX_TAG: Record<string, string> = {
  // —— SVG：HTML 解析器常见小写 → 规范标签名（camelCase）
  altglyph: 'altGlyph',
  altglyphdef: 'altGlyphDef',
  altglyphitem: 'altGlyphItem',
  animatecolor: 'animateColor',
  animatemotion: 'animateMotion',
  animatetransform: 'animateTransform',
  clippath: 'clipPath',
  colorprofile: 'colorProfile',
  foreignobject: 'foreignObject',
  glyphref: 'glyphRef',
  lineargradient: 'linearGradient',
  radialgradient: 'radialGradient',
  textpath: 'textPath',
  missingglyph: 'missingGlyph',
  meshgradient: 'meshGradient',
  meshpatch: 'meshPatch',
  meshrow: 'meshRow',
  // —— filter 系（fe*）
  feblend: 'feBlend',
  fecolormatrix: 'feColorMatrix',
  fecomponenttransfer: 'feComponentTransfer',
  fecomposite: 'feComposite',
  feconvolvematrix: 'feConvolveMatrix',
  fediffuselighting: 'feDiffuseLighting',
  fedisplacementmap: 'feDisplacementMap',
  fedistantlight: 'feDistantLight',
  fedropshadow: 'feDropShadow',
  feflood: 'feFlood',
  fefunca: 'feFuncA',
  fefuncb: 'feFuncB',
  fefuncg: 'feFuncG',
  fefuncr: 'feFuncR',
  fegaussianblur: 'feGaussianBlur',
  feimage: 'feImage',
  femerge: 'feMerge',
  femergenode: 'feMergeNode',
  femorphology: 'feMorphology',
  feoffset: 'feOffset',
  fepointlight: 'fePointLight',
  fespecularlighting: 'feSpecularLighting',
  fespotlight: 'feSpotLight',
  fetile: 'feTile',
  feturbulence: 'feTurbulence',
  // —— MathML（若在 Mermaid SVG 的 foreignObject 外嵌套时出现）
  maction: 'maction',
  maligngroup: 'maligngroup',
  malignmark: 'malignmark',
  math: 'math',
  menclose: 'menclose',
  merror: 'merror',
  mfenced: 'mfenced',
  mfrac: 'mfrac',
  mglyph: 'mglyph',
  mi: 'mi',
  mlabeledtr: 'mlabeledtr',
  mlongdiv: 'mlongdiv',
  mmultiscripts: 'mmultiscripts',
  mn: 'mn',
  mo: 'mo',
  mover: 'mover',
  mpadded: 'mpadded',
  mphantom: 'mphantom',
  mroot: 'mroot',
  mrow: 'mrow',
  ms: 'ms',
  mscarries: 'mscarries',
  mscarry: 'mscarry',
  msgroup: 'msgroup',
  msline: 'msline',
  mspace: 'mspace',
  msqrt: 'msqrt',
  mstyle: 'mstyle',
  msub: 'msub',
  msup: 'msup',
  msubsup: 'msubsup',
  mtable: 'mtable',
  mtd: 'mtd',
  mtext: 'mtext',
  mtr: 'mtr',
  munder: 'munder',
  munderover: 'munderover',
  semantics: 'semantics',
}

function domToJsxTagName(el: Element): string {
  const uri = el.namespaceURI
  if (uri === SVG_NS || uri === MATHML_NS) {
    const key = el.tagName.toLowerCase()
    /** 未映射时用小写 `key`：`el.tagName` 可能是 `SVG`，Viewfly 需要 `svg` */
    return DOM_TO_JSX_TAG[key] ?? key
  }
  return el.tagName.toLowerCase()
}

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
  const i18n = inject(I18nService)

  /**
   * 必须存 SVG 字符串，勿长期持有 parse 出来的 DOM 节点：
   * Viewfly 挂载 domToVDom 生成的树时可能移动/掏空该节点，再次 domToVDom(同一引用) 会变成空。
   */
  const svgMarkup = createSignal<string | null>(null)
  const renderError = createSignal<string | null>(null)

  props.component.changeMarker.onChange.subscribe(() => {
    render()
  })

  /** 每次 `Mermaid.render` 必须用新 id：同一 id 多次渲染时 Mermaid 内部样式/缓存等与 `#id` 绑定，易导致 defs、子树重复或异常 */
  function nextMermaidRenderId() {
    return `xnote-m-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
  }

  function normDef(s: string) {
    return s.replace(/\r\n/g, '\n').trimEnd()
  }

  function mermaidErrorNode(detail: string, inline = false): JSXNode {
    return jsx('div', {
      class: inline ? 'xnote-mermaid-error xnote-mermaid-error--inline' : 'xnote-mermaid-error',
      children: [
        jsx('div', { class: 'xnote-mermaid-error-message', children: [detail] }),
        jsx('div', {
          class: 'xnote-mermaid-error-doc',
          children: [
            `${i18n.t('mermaid.renderErrorDoc')}: `,
            jsx('a', {
              href: MERMAID_DOC_URL,
              target: '_blank',
              rel: 'noreferrer',
              children: [MERMAID_DOC_URL],
            }),
          ],
        }),
      ],
    })
  }

  function render() {
    const definition = props.component.state.text
    if (!definition?.trim()) {
      svgMarkup.set(null)
      renderError.set(null)
      return
    }
    const requestedDef = normDef(definition)
    renderError.set(null)
    const container = document.createElement('div')
    document.body.appendChild(container)
    Mermaid.render(nextMermaidRenderId(), definition, container)
      .then((result) => {
        if (normDef(props.component.state.text) !== requestedDef) {
          return
        }
        svgMarkup.set(result.svg)
        renderError.set(null)
      })
      .catch((error: unknown) => {
        if (normDef(props.component.state.text) !== requestedDef) {
          return
        }
        renderError.set(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        container.remove()
      })
  }

  if (props.component.state.text) {
    render()
  }

  function domToVDom(el: Element | null): JSXNode {
    if (!el) {
      return jsx('span', {
        class: 'xnote-mermaid-empty',
        children: [props.component.state.text ? '' : i18n.t('mermaid.empty')]
      })
    }
    const attrs: { [key: string]: any } = {}
    el.getAttributeNames().forEach(key => {
      attrs[key] = el.getAttribute(key)!
    })
    attrs.children = Array.from(el.childNodes).map(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        return domToVDom(child as Element)
      }
      return child.textContent || ''
    })

    const tagName = domToJsxTagName(el)
    return jsx(tagName, attrs)
  }

  const output = useOutput()
  const readonly = useReadonly()

  function mermaidPreview(): JSXNode {
    const err = renderError()
    const markup = svgMarkup()
    const src = props.component.state.text ?? ''

    if (!src.trim()) {
      return domToVDom(null)
    }
    if (err && !markup) {
      return mermaidErrorNode(err)
    }
    if (!markup) {
      return jsx('span', {
        class: 'xnote-mermaid-empty',
        children: [''],
      })
    }
    try {
      const doc = new DOMParser().parseFromString(markup, 'text/html')
      const root = doc.body.children[0] as Element | undefined
      if (!root) {
        return domToVDom(null)
      }
      const chart = domToVDom(root as Element)
      if (!err) {
        return jsx('div', { class: 'xnote-mermaid-svg-host', children: [chart] })
      }
      return jsx('div', {
        class: 'xnote-mermaid-preview-stack',
        children: [
          jsx('div', { class: 'xnote-mermaid-svg-host', children: [chart] }),
          mermaidErrorNode(err, true),
        ],
      })
    } catch {
      return domToVDom(null)
    }
  }

  const textbus = inject(Textbus)

  function onChange(text: string) {
    props.component.state.text = text
  }

  function onReady() {
    textbus.blur()
  }

  return () => {
    const text = props.component.state.text
    const preview = mermaidPreview()
    return (
      <div ref={props.rootRef} data-component={MermaidComponent.componentName} data-mermaid={encodeURIComponent(text)}
           class="xnote-mermaid">
        {
          (output() || readonly()) ?
            preview
            :
            <Dropdown block dropdown={
              <SourceCodeEditor i18n={i18n}
                                sourceCode={text}
                                language={''}
                                onReady={onReady}
                                helpLink={'https://mermaid.js.org/intro/'}
                                onChange={onChange}/>
            }>
              <div class="xnote-mermaid-content">
                {preview}
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
