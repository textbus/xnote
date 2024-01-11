import { Adapter } from '@textbus/adapter-viewfly'
import { createApp } from '@viewfly/platform-browser'
import { BrowserModule, Parser } from '@textbus/platform-browser'
import { ComponentInstance, Textbus } from '@textbus/core'

import {
  BlockquoteView,
  blockquoteComponent,
  blockquoteComponentLoader,
  HighlightBoxView,
  highlightBoxComponent,
  highlightBoxComponentLoader,
  listComponent,
  ListComponentView,
  ParagraphView,
  paragraphComponent,
  paragraphComponentLoader,
  RootView,
  rootComponent,
  rootComponentLoader,
  SourceCodeView,
  sourceCodeComponent,
  sourceCodeComponentLoader,
  tableComponent,
  tableComponentLoader,
  TableComponentView,
  TodolistView,
  todolistComponent,
  todolistComponentLoader,
  listComponentLoader
} from './textbus/components/_api'
import { LeftToolbarPlugin, ToolbarPlugin } from './plugins/_api'
import { LeftToolbarService } from './services/_api'
import {
  backgroundColorFormatLoader,
  backgroundColorFormatter,
  boldFormatLoader,
  boldFormatter,
  codeFormatLoader,
  codeFormatter,
  colorFormatLoader,
  colorFormatter,
  fontFamilyFormatLoader,
  fontFamilyFormatter,
  fontSizeFormatLoader,
  fontSizeFormatter,
  italicFormatLoader,
  italicFormatter,
  linkFormatLoader,
  linkFormatter,
  registerBoldShortcut,
  registerCodeShortcut,
  registerItalicShortcut,
  registerStrikeThroughShortcut,
  registerUnderlineShortcut,
  strikeThroughFormatLoader,
  strikeThroughFormatter,
  underlineFormatLoader,
  underlineFormatter
} from './textbus/formatters/_api'

import './textbus/doc.scss'
import { headingAttrLoader } from './textbus/attributes/heading.attr'
import { textAlignAttrLoader } from './textbus/attributes/text-align.attr'
import { textIndentAttrLoader } from './textbus/attributes/text-indent.attr'

export interface XNoteConfig {
  content?: string
}

export async function createXNote(host: HTMLElement, config: XNoteConfig = {}) {
  const adapter = new Adapter({
    [paragraphComponent.name]: ParagraphView,
    [rootComponent.name]: RootView,
    [blockquoteComponent.name]: BlockquoteView,
    [todolistComponent.name]: TodolistView,
    [sourceCodeComponent.name]: SourceCodeView,
    [tableComponent.name]: TableComponentView,
    [highlightBoxComponent.name]: HighlightBoxView,
    [listComponent.name]: ListComponentView
  }, (host, root) => {
    const app = createApp(root, {
      context: textbus
    }).mount(host)
    return () => {
      app.destroy()
    }
  })
  const browserModule = new BrowserModule({
    renderTo(): HTMLElement {
      return host
    },
    adapter,
    componentLoaders: [
      highlightBoxComponentLoader,
      blockquoteComponentLoader,
      paragraphComponentLoader,
      sourceCodeComponentLoader,
      todolistComponentLoader,
      tableComponentLoader,
      listComponentLoader
    ],
    formatLoaders: [
      backgroundColorFormatLoader,
      boldFormatLoader,
      codeFormatLoader,
      colorFormatLoader,
      fontFamilyFormatLoader,
      fontSizeFormatLoader,
      italicFormatLoader,
      linkFormatLoader,
      strikeThroughFormatLoader,
      underlineFormatLoader
    ],
    attributeLoaders: [
      headingAttrLoader,
      textAlignAttrLoader,
      textIndentAttrLoader
    ]
  })
  const textbus = new Textbus({
    imports: [
      browserModule
    ],
    components: [
      blockquoteComponent,
      paragraphComponent,
      sourceCodeComponent,
      todolistComponent,
      tableComponent
    ],
    formatters: [
      backgroundColorFormatter,
      boldFormatter,
      codeFormatter,
      colorFormatter,
      fontFamilyFormatter,
      fontSizeFormatter,
      italicFormatter,
      linkFormatter,
      strikeThroughFormatter,
      underlineFormatter
    ],
    providers: [
      LeftToolbarService
    ],
    plugins: [
      new LeftToolbarPlugin(),
      new ToolbarPlugin(),
    ],
    setup(textbus: Textbus) {
      registerBoldShortcut(textbus)
      registerCodeShortcut(textbus)
      registerItalicShortcut(textbus)
      registerStrikeThroughShortcut(textbus)
      registerUnderlineShortcut(textbus)
    }
  })
  let rootComp: ComponentInstance
  if (config.content) {
    const parser = textbus.get(Parser)
    const doc = parser.parseDoc(config.content, rootComponentLoader)
    rootComp = doc instanceof ComponentInstance ? doc : rootComponent.createInstance(textbus, {
      slots: doc ? [doc] : []
    })
  } else {
    rootComp = rootComponent.createInstance(textbus)
  }
  await textbus.render(rootComp)
  // textbus.onChange.subscribe(() => {
  //   console.log(rootComp.toJSON())
  // })
  return textbus
}
