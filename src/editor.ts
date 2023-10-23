import { Adapter } from '@textbus/adapter-viewfly'
import { createApp } from '@viewfly/platform-browser'
import { BrowserModule, Parser } from '@textbus/platform-browser'
import { ComponentInstance, Textbus } from '@textbus/core'

import {
  Blockquote,
  blockquoteComponent,
  blockquoteComponentLoader,
  Paragraph,
  paragraphComponent,
  paragraphComponentLoader,
  Root,
  rootComponent,
  rootComponentLoader, SourceCode, sourceCodeComponent, sourceCodeComponentLoader,
  Todolist,
  todolistComponent,
  todolistComponentLoader
} from './textbus/components/_api'
import { LeftToolbarPlugin, ToolbarPlugin } from './plugins/_api'
import { LeftToolbarService } from './services/_api'
import {
  backgroundColorFormatLoader, backgroundColorFormatter,
  boldFormatLoader,
  boldFormatter, codeFormatLoader, codeFormatter, colorFormatLoader, colorFormatter,
  italicFormatLoader, italicFormatter, linkFormatLoader, linkFormatter,
  strikeThroughFormatLoader, strikeThroughFormatter,
  underlineFormatLoader, underlineFormatter
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
    [paragraphComponent.name]: Paragraph,
    [rootComponent.name]: Root,
    [blockquoteComponent.name]: Blockquote,
    [todolistComponent.name]: Todolist,
    [sourceCodeComponent.name]: SourceCode
  }, (host, root) => {
    const app = createApp(root, {
      context: textbus
    }).mount(host)
    return () => {
      app.destroy()
    }
  })
  const browserModule = new BrowserModule(host, {
    adapter,
    componentLoaders: [
      blockquoteComponentLoader,
      paragraphComponentLoader,
      sourceCodeComponentLoader,
      todolistComponentLoader,
    ],
    formatLoaders: [
      backgroundColorFormatLoader,
      boldFormatLoader,
      codeFormatLoader,
      colorFormatLoader,
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
      todolistComponent
    ],
    formatters: [
      backgroundColorFormatter,
      boldFormatter,
      codeFormatter,
      colorFormatter,
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
    ]
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
