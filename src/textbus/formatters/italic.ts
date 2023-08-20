import { ComponentInstance, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const italicFormatter: Formatter<boolean> = {
  name: 'italic',
  render(children: Array<VElement | VTextNode | ComponentInstance>): VElement | FormatHostBindingRender {
    return createVNode('em', null, children)
  }
}

export const italicFormatLoader: FormatLoader<boolean> = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'EM' || element.tagName === 'I' || /italic/.test(element.style.fontStyle)
  },
  read(): FormatLoaderReadResult<boolean> {
    return {
      formatter: italicFormatter,
      value: true
    }
  }
}
