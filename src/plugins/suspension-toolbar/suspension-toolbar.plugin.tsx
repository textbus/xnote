import { Plugin } from '@textbus/core'
import { Application, Injector } from '@viewfly/core'
import { createApp } from '@viewfly/platform-browser'
import { VIEW_CONTAINER } from '@textbus/platform-browser'

import { SuspensionToolbar } from './suspension-toolbar'

export interface SuspensionToolbarOptions {
  theme?: 'dark' | 'light'
}

export class SuspensionToolbarPlugin implements Plugin {
  private app: Application | null = null

  private container: HTMLElement | null = null

  constructor(public options: SuspensionToolbarOptions = {}) {
  }

  setup(injector: Injector) {
    const host = injector.get(VIEW_CONTAINER)
    const container = document.createElement('div')
    this.app = createApp(<SuspensionToolbar theme={this.options.theme}/>, {
      context: injector
    })
    host.prepend(container)
    this.container = container
    this.app.mount(container)
  }

  onDestroy() {
    this.container?.remove()
    this.app?.destroy()
  }
}
