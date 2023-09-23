import { ComponentInstance, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const backgroundColorFormatter: Formatter<string> = {
  name: 'color',
  columned: true,
  render(children: Array<VElement | VTextNode | ComponentInstance>, formatValue: string): VElement | FormatHostBindingRender {
    return {
      fallbackTagName: 'span',
      attach(host: VElement) {
        host.styles.set('backgroundColor', formatValue)
      }
    }
  }
}

export const backgroundColorFormatLoader: FormatLoader<string> = {
  match(element: HTMLElement): boolean {
    return !!element.style.backgroundColor
  },
  read(element: HTMLElement): FormatLoaderReadResult<string> {
    return {
      formatter: backgroundColorFormatter,
      value: element.style.backgroundColor
    }
  }
}
