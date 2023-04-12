import { Injector, Plugin } from '@textbus/core'

import LeftToolbar from './left-toolbar.vue'
import { App, createApp } from 'vue'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'
import { reflectiveInjectorPlugin } from '@tanbo/vue-di-plugin'

export class LeftToolbarPlugin implements Plugin {
  private app: App | null = null

  setup(injector: Injector) {
    this.app = createApp(LeftToolbar).use(reflectiveInjectorPlugin, injector)
    const viewDocument = injector.get(VIEW_DOCUMENT)
    const host = document.createElement('div')
    viewDocument.appendChild(host)
    this.app.mount(host)
  }

  onDestroy() {
    this.app?.unmount()
  }
}
