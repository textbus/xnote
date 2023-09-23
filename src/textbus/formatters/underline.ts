import { ComponentInstance, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const underlineFormatter: Formatter<boolean> = {
  name: 'underline',
  columned: true,
  render(children: Array<VElement | VTextNode | ComponentInstance>): VElement | FormatHostBindingRender {
    return createVNode('u', null, children)
  }
}

export const underlineFormatLoader: FormatLoader<boolean> = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'U'
  },
  read(): FormatLoaderReadResult<boolean> {
    return {
      formatter: underlineFormatter,
      value: true
    }
  }
}
