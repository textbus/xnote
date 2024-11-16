import { Plugin } from '@textbus/core'
import { VIEW_DOCUMENT } from '@textbus/platform-browser'
import { Application, Injector } from '@viewfly/core'
import { createApp } from '@viewfly/platform-browser'

import { InlineToolbar } from './inline-toolbar'
import { useReadonly } from '../../textbus/hooks/use-readonly'

export interface InlineToolbarOptions {
  theme?: 'dark' | 'light'
}

export class InlineToolbarPlugin implements Plugin {
  private app: Application | null = null

  constructor(private config: InlineToolbarOptions = {}) {
  }

  setup(injector: Injector) {
    const App = () => {
      const readonly = useReadonly()
      return () => {
        return readonly() ? null : <InlineToolbar theme={this.config.theme}/>
      }
    }
    this.app = createApp(<App/>, {
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
