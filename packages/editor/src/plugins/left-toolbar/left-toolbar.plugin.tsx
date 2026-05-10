import { Plugin } from '@textbus/core'
import { VIEW_CONTAINER } from '@textbus/platform-browser'
import { Application, Injector, viewfly } from '@viewfly/core'
import { DomRenderer } from '@viewfly/platform-browser'

import { LeftToolbar } from './left-toolbar'
import { useReadonly } from '../../textbus/hooks/use-readonly'

export interface LeftToolbarOptions {
  theme?: 'dark' | 'light'
}

export class LeftToolbarPlugin implements Plugin {
  private app: Application | null = null

  constructor(private options: LeftToolbarOptions = {}) {
  }

  setup(injector: Injector) {
    const App = function () {
      const readonly = useReadonly()
      return () => {
        return readonly() ? null : <LeftToolbar/>
      }
    }
    this.app = viewfly({
      root: <App/>,
      context: injector,
      nativeRenderer: new DomRenderer(),
      autoUpdate: true
    })
    const viewDocument = injector.get(VIEW_CONTAINER)
    const host = document.createElement('div')
    if (this.options.theme === 'dark') {
      host.classList.add(
        'vfui-dark'
      )
    }
    viewDocument.appendChild(host)
    this.app.mount(host)
  }

  onDestroy() {
    this.app?.destroy()
  }
}
