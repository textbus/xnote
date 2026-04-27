import { Plugin } from '@textbus/core'
import { Application, createContext, Injector } from '@viewfly/core'
import { createApp } from '@viewfly/platform-browser'

import { StaticToolbar } from './static-toolbar'

export interface StaticToolbarOptions {
  host: HTMLElement
  theme?: 'dark' | 'light'
}

export class StaticToolbarPlugin implements Plugin {
  private app: Application | null = null

  private container: HTMLElement | null = null
  constructor(public options: StaticToolbarOptions) {
  }

  setup(injector: Injector) {
    const container = document.createElement('div')
    container.style.position = 'relative'
    container.style.borderRadius = 'inherit'
    this.app = createApp(<StaticToolbar theme={this.options.theme} />, {
      context: injector
    })
    this.options.host.appendChild(container)
    this.container = container
    this.app.mount(container)
  }

  onDestroy() {
    this.container?.remove()
    this.app?.destroy()
  }
}
