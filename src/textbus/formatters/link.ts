import { Component, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export interface LinkFormatData {
  href: string
  target?: '_blank' | '_self'
}

export const linkFormatter = new Formatter<LinkFormatData>('link', {
  priority: -1,
  inheritable: false,
  render(children: Array<VElement | VTextNode | Component>, formatValue: LinkFormatData): VElement | FormatHostBindingRender {
    return createVNode('a', {
      href: formatValue.href,
      target: formatValue.target
    }, children)
  }
})

export const linkFormatLoader: FormatLoader<LinkFormatData> = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'A'
  },
  read(element: HTMLLinkElement): FormatLoaderReadResult<LinkFormatData> {
    return {
      formatter: linkFormatter,
      value: {
        href: element.href,
        target: element.target as LinkFormatData['target'] || '_self'
      }
    }
  }
}
