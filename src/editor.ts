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
import { boldFormatLoader, boldFormatter } from '@/textbus/formatters/inline-element.formatter'

export class XNote extends Viewer {
  constructor() {
    super(rootComponent, rootComponentLoader, {
      formatters: [
        boldFormatter
      ],
      formatLoaders: [
        boldFormatLoader
      ],
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
        LeftToolbarService,
      ],
      plugins: [
        () => new ToolbarPlugin(),
        () => new LeftToolbarPlugin()
      ]
    })
  }
}
