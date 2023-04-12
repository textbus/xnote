import { Viewer } from '@textbus/platform-browser'
import {
  blockquoteComponent, blockquoteComponentLoader,
  paragraphComponent,
  paragraphComponentLoader,
  rootComponent,
  rootComponentLoader, todolistComponent, todolistComponentLoader
} from '@/textbus/components/_api'
import { LeftToolbarPlugin, ToolbarPlugin } from '@/plugins/_api'
import { LeftToolbarService } from '@/services/_api'

export class XNote extends Viewer {
  constructor() {
    super(rootComponent, rootComponentLoader, {
      components: [
        blockquoteComponent,
        paragraphComponent,
        todolistComponent,
      ],
      componentLoaders: [
        blockquoteComponentLoader,
        paragraphComponentLoader,
        todolistComponentLoader
      ],
      providers: [
        LeftToolbarService
      ],
      plugins: [
        () => new ToolbarPlugin(),
        () => new LeftToolbarPlugin()
      ]
    })
  }
}
