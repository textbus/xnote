import { ComponentInstance, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const codeFormatter = new Formatter<boolean>('code', {
  render(children: Array<VElement | VTextNode | ComponentInstance>): VElement | FormatHostBindingRender {
    return createVNode('code', {
      class: 'xnote-code'
    }, children)
  }
})

export const codeFormatLoader: FormatLoader<boolean> = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'CODE'
  },
  read(): FormatLoaderReadResult<boolean> {
    return {
      formatter: codeFormatter,
      value: true
    }
  }
}
