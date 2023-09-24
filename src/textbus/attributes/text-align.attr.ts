import { Attribute, VElement } from '@textbus/core'
import { AttributeLoader, AttributeLoaderReadResult } from '@textbus/platform-browser'

export const textAlignAttr: Attribute<string> = {
  name: 'textAlign',
  render(node: VElement, formatValue: string) {
    node.styles.set('text-align', formatValue)
  }
}

export const textAlignAttrLoader: AttributeLoader<string> = {
  match(element: HTMLElement): boolean {
    return !!element.style.textAlign
  },
  read(element: HTMLElement): AttributeLoaderReadResult<string> {
    return {
      attribute: textAlignAttr,
      value: element.style.textAlign
    }
  }
}
