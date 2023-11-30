import {
  Commander,
  ComponentInstance,
  Controller,
  createVNode,
  FormatHostBindingRender,
  Formatter,
  Keyboard, Query, QueryStateType,
  Textbus,
  VElement,
  VTextNode
} from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export class BoldFormatter extends Formatter<boolean> {
  private controller!: Controller
  private query!: Query
  private commander!: Commander

  constructor() {
    super('bold', {
      setup: (textbus: Textbus) => {
        const keyboard = textbus.get(Keyboard)
        this.controller = textbus.get(Controller)
        this.query = textbus.get(Query)
        this.commander = textbus.get(Commander)
        keyboard.addShortcut({
          keymap: {
            ctrlKey: true,
            key: 'b'
          },
          action: () => {
            this.toggle()
          }
        })
      },
      render(children: Array<VElement | VTextNode | ComponentInstance>): VElement | FormatHostBindingRender {
        return createVNode('strong', null, children)
      }
    })
  }

  toggle() {
    if (this.controller.readonly) {
      return
    }
    const state = this.query.queryFormat(this)

    if (state.state === QueryStateType.Normal) {
      this.commander.applyFormat(this, true)
    } else {
      this.commander.unApplyFormat(this)
    }
  }
}

export const boldFormatter = new BoldFormatter()

export const boldFormatLoader: FormatLoader<boolean> = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'STRONG' || element.tagName === 'B' || /bold|[5-9]00/.test(element.style.fontWeight)
  },
  read(): FormatLoaderReadResult<boolean> {
    return {
      formatter: boldFormatter,
      value: true
    }
  }
}
