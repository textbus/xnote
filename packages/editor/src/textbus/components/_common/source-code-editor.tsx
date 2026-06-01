import { ContentType, fromEvent, Slot, Subject, Textbus } from '@textbus/core'
import { BrowserModule, isMobileBrowser } from '@textbus/platform-browser'
import { ViewflyAdapter } from '@textbus/adapter-viewfly'
import { createApp } from '@viewfly/platform-browser'
import { createDynamicRef, ReflectiveInjector } from '@viewfly/core'

import { OutputInjectionToken } from '../../injection-tokens'
import { SourceCodeComponent, SourceCodeView } from '../source-code/source-code.component'
import { I18nService } from '../../../services/i18n.service'
import './source-code-editor.scss'

class Editor extends Textbus {
  host!: HTMLElement

  onValueChange = new Subject<string>()

  constructor(i18nService: I18nService, private lang: string) {
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
      useContentEditable: isMobileBrowser(),
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
      lang: this.lang,
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

export interface SourceEditorProps {
  i18n: I18nService
  sourceCode: string
  language: string
  onChange: (sourceCode: string) => void
  helpLink?: string
  onReady: () => void
}

export function SourceCodeEditor(props: SourceEditorProps) {
  const editorRef = createDynamicRef<HTMLElement>(node => {
    const editor = new Editor(props.i18n, props.language)

    editor.mount(node, props.sourceCode).then(() => {
      props.onReady()
      editor.focus()
    })

    const subscription = editor.onValueChange.subscribe((value) => {
      props.onChange(value)
    }).add(
      fromEvent(node, 'mousedown').subscribe(ev => ev.stopPropagation()),
    )

    return () => {
      subscription.unsubscribe()
      editor.destroy()
    }
  })
  return () => {
    return (
      <>
        <div class="xnote-source-code-editor" ref={editorRef}>
        </div>
        {
          props.helpLink && <div class="xnote-source-code-editor-help">
            <a href={props.helpLink} target={'_blank'}>{props.i18n.t('sourceCode.viewHelp')}</a>
          </div>
        }
      </>
    )
  }
}


