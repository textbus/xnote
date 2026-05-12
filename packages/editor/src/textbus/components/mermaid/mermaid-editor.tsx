import { ContentType, Slot, Subject, Textbus } from '@textbus/core'
import { BrowserModule } from '@textbus/platform-browser'
import { ViewflyAdapter } from '@textbus/adapter-viewfly'
import { createApp } from '@viewfly/platform-browser'
import { ReflectiveInjector } from '@viewfly/core'


import { I18nService } from '../../../services/i18n.service'
import { OutputInjectionToken } from '../../injection-tokens'
import { SourceCodeComponent, SourceCodeView } from '../source-code/source-code.component'

export class MermaidEditor extends Textbus {
  host!: HTMLElement

  onValueChange = new Subject<string>()

  constructor(i18nService: I18nService) {
    const adapter = new ViewflyAdapter({
      [SourceCodeComponent.componentName]: SourceCodeView
    }, (host, root, injector) => {
      const appInjector = new ReflectiveInjector(injector, [{
        provide: OutputInjectionToken,
        useValue: true
      }])
      const app = createApp(root, {
        context: appInjector
      }).mount(host)

      return () => {
        app.destroy()
      }
    })
    const browserModule = new BrowserModule({
      adapter,
      renderTo: () => {
        return this.host
      }
    })
    super({
      components: [
        SourceCodeComponent
      ],
      imports: [browserModule],
      providers: [
        {
          provide: I18nService,
          useValue: i18nService
        }
      ]
    })
  }

  mount(host: HTMLElement, code: string) {
    this.host = host

    const model = new SourceCodeComponent({
      lineNumber: true,
      autoBreak: true,
      lang: '',
      theme: 'github',
      slots: code.split('\n').map(i => {
        const slot = new Slot([ContentType.Text])
        slot.insert(i)
        return {
          slot,
          emphasize: false
        }
      })
    })
    this.onChange.subscribe(() => {
      const str = model.state.slots.map(i => {
        if (i.slot.isEmpty) {
          return ''
        }
        return i.slot.toString()
      }).join('\n')
      this.onValueChange.next(str)
    })
    return this.render(model)
  }
}
