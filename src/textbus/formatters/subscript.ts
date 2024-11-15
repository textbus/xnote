import { Component, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const subscriptFormatter = new Formatter<boolean>('sub', {
  render(children: Array<VElement | VTextNode | Component>): VElement | FormatHostBindingRender {
    return createVNode('sub', null, children)
  }
})

export const subscriptFormatLoader: FormatLoader = {
  match(element: Element): boolean {
    return element.tagName === 'SUB'
  },
  read(): FormatLoaderReadResult {
    return {
      formatter: subscriptFormatter,
      value: true
    }
  }
}
