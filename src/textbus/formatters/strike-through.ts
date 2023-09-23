import { ComponentInstance, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const strikeThroughFormatter: Formatter<boolean> = {
  name: 'strike',
  columned: true,
  render(children: Array<VElement | VTextNode | ComponentInstance>): VElement | FormatHostBindingRender {
    return createVNode('del', null, children)
  }
}

export const strikeThroughFormatLoader: FormatLoader<boolean> = {
  match(element: HTMLElement): boolean {
    return /strike|del|s/i.test(element.tagName) || /line-through/.test(element.style.textDecoration)
  },
  read(): FormatLoaderReadResult<boolean> {
    return {
      formatter: strikeThroughFormatter,
      value: true
    }
  }
}
