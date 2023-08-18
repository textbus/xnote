import { Adapter } from '@textbus/adapter-viewfly'
import { createApp } from '@viewfly/platform-browser'
import { BrowserModule } from '@textbus/platform-browser'
import { Textbus } from '@textbus/core'

import {
  Blockquote,
  blockquoteComponent,
  blockquoteComponentLoader,
  Paragraph,
  paragraphComponent,
  paragraphComponentLoader,
  Root,
  rootComponent,
  Todolist,
  todolistComponent,
  todolistComponentLoader
} from './textbus/components/_api'
import { LeftToolbarPlugin, ToolbarPlugin } from './plugins/_api'
import { LeftToolbarService } from './services/_api'
import { boldFormatLoader, boldFormatter } from './textbus/formatters/inline-element.formatter'

export async function createXNote(host: HTMLElement) {
  const adapter = new Adapter({
    [paragraphComponent.name]: Paragraph,
    [rootComponent.name]: Root,
    [blockquoteComponent.name]: Blockquote,
    [todolistComponent.name]: Todolist
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
      todolistComponentLoader,
      blockquoteComponentLoader,
      paragraphComponentLoader
    ],
    formatLoaders: [
      boldFormatLoader
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
      boldFormatter
    ],
    providers: [
      LeftToolbarService
    ],
    plugins: [
      new ToolbarPlugin(),
      new LeftToolbarPlugin()
    ]
  })
  const rootComp = rootComponent.createInstance(textbus)
  await textbus.render(rootComp)
  return textbus
}
