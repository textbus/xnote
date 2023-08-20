import { Plugin } from '@textbus/core'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'
import { Application, Injector } from '@viewfly/core'
import { createApp } from '@viewfly/platform-browser'

import { Toolbar } from './toolbar'

export class ToolbarPlugin implements Plugin {
  private app: Application | null = null

  setup(injector: Injector) {
    this.app = createApp(<Toolbar/>, {
      context: injector
    })
    const viewDocument = injector.get(VIEW_DOCUMENT)
    const host = document.createElement('div')
    viewDocument.appendChild(host)
    this.app.mount(host)
  }

  onDestroy() {
    this.app?.destroy()
  }
}
