import { ComponentInstance, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const colorFormatter: Formatter<string> = {
  name: 'color',
  render(children: Array<VElement | VTextNode | ComponentInstance>, formatValue: string): VElement | FormatHostBindingRender {
    return {
      fallbackTagName: 'span',
      attach(host: VElement) {
        host.styles.set('color', formatValue)
      }
    }
  }
}

export const colorFormatLoader: FormatLoader<string> = {
  match(element: HTMLElement): boolean {
    return !!element.style.color
  },
  read(element: HTMLElement): FormatLoaderReadResult<string> {
    return {
      formatter: colorFormatter,
      value: element.style.color
    }
  }
}
