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
  boldFormatLoader,
  boldFormatter,
  italicFormatLoader, italicFormatter,
  strikeThroughFormatLoader, strikeThroughFormatter,
  underlineFormatLoader, underlineFormatter
} from './textbus/formatters/_api'

import './textbus/doc.scss'

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
      paragraphComponentLoader,
      todolistComponentLoader,
      blockquoteComponentLoader,
      sourceCodeComponentLoader
    ],
    formatLoaders: [
      boldFormatLoader,
      italicFormatLoader,
      strikeThroughFormatLoader,
      underlineFormatLoader
    ]
  })
  const textbus = new Textbus({
    imports: [
      browserModule
    ],
    components: [
      paragraphComponent,
      blockquoteComponent,
      todolistComponent
    ],
    formatters: [
      boldFormatter,
      italicFormatter,
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
