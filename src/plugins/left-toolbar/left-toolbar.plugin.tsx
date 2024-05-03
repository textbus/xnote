import { Plugin } from '@textbus/core'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'
import { Application, Injector, viewfly } from '@viewfly/core'
import { DomRenderer } from '@viewfly/platform-browser'

import { LeftToolbar } from './left-toolbar'

export class LeftToolbarPlugin implements Plugin {
  private app: Application | null = null

  setup(injector: Injector) {
    this.app = viewfly({
      root: <LeftToolbar/>,
      context: injector,
      nativeRenderer: new DomRenderer(),
      autoUpdate: true
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
