import { Attribute, VElement } from '@textbus/core'
import { AttributeLoader, AttributeLoaderReadResult } from '@textbus/platform-browser'

export const textIndentAttr = new Attribute<number>('textIndent', {
  render(node: VElement, formatValue: number) {
    return node.styles.set('text-indent', formatValue * 24 + 'px')
  }
})

export const textIndentAttrLoader: AttributeLoader<number> = {
  match(element: HTMLElement): boolean {
    return !!element.style.textIndent
  },
  read(element: HTMLElement): AttributeLoaderReadResult<number> {
    return {
      attribute: textIndentAttr,
      value: (parseInt(element.style.textIndent) || 0) / 24
    }
  }
}
