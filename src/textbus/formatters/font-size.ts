import { ComponentInstance, FormatHostBindingRender, Formatter, VElement, VTextNode } from '@textbus/core'
import { FormatLoader, FormatLoaderReadResult } from '@textbus/platform-browser'

export const fontSizeFormatter: Formatter<string> = {
  name: 'fontSize',
  render(children: Array<VElement | VTextNode | ComponentInstance>, formatValue: string): VElement | FormatHostBindingRender {
    return {
      fallbackTagName: 'span',
      attach(host: VElement) {
        host.styles.set('fontSize', formatValue)
      }
    }
  }
}

export const fontSizeFormatLoader: FormatLoader<string> = {
  match(element: HTMLElement): boolean {
    return !!element.style.fontSize
  },
  read(element: HTMLElement): FormatLoaderReadResult<string> {
    return {
      formatter: fontSizeFormatter,
      value: element.style.fontSize
    }
  }
}
