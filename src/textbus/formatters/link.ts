import { ComponentInstance, createVNode, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export interface LinkFormatData {
  href: string
  target?: '_blank' | '_self'
}

export const linkFormatter: Formatter<LinkFormatData> = {
  name: 'link',
  render(children: Array<VElement | VTextNode | ComponentInstance>, formatValue: LinkFormatData): VElement | FormatHostBindingRender {
    return createVNode('a', {
      href: formatValue.href,
      target: formatValue.target
    })
  }
}

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
