import { Plugin } from '@textbus/core'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'
import { Application, Injector } from '@viewfly/core'
import { createApp } from '@viewfly/platform-browser'

import { StaticToolbar } from './static-toolbar'

export class StaticToolbarPlugin implements Plugin {
  private app: Application | null = null

  setup(injector: Injector) {
    this.app = createApp(<StaticToolbar/>, {
      context: injector
    })
    const viewDocument = injector.get(VIEW_DOCUMENT)
    const host = document.createElement('div')
    viewDocument.prepend(host)
    this.app.mount(host)
  }

  onDestroy() {
    this.app?.destroy()
  }
}
