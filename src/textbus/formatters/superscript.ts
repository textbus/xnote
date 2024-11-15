import { Component, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const superscriptFormatter = new Formatter<boolean>('super', {
  render(children: Array<VElement | VTextNode | Component>): VElement | FormatHostBindingRender {
    return createVNode('sup', null, children)
  }
})

export const superscriptFormatLoader: FormatLoader = {
  match(element: Element): boolean {
    return element.tagName === 'SUP'
  },
  read(): FormatLoaderReadResult {
    return {
      formatter: superscriptFormatter,
      value: true
    }
  }
}
