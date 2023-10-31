import { ComponentInstance, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const boldFormatter = new Formatter<boolean>('bold', {
  render(children: Array<VElement | VTextNode | ComponentInstance>): VElement | FormatHostBindingRender {
    return createVNode('strong', null, children)
  }
})

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
