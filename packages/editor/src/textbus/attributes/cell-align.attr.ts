import { Attribute, Slot, VElement } from '@textbus/core'
import { AttributeLoader, AttributeLoaderReadResult } from '@textbus/platform-browser'

import { TableComponent } from '../components/table/table.component'

export const cellAlignAttr = new Attribute<string>('cellAlign', {
  onlySelf: true,
  checkHost(host: Slot): boolean {
    return host.parent instanceof TableComponent
  },
  render(node: VElement, formatValue: string) {
    node.styles.set('verticalAlign', formatValue)
  }
})

export const cellAlignAttrLoader: AttributeLoader<string> = {
  match(element: Element): boolean {
    return element instanceof HTMLTableCellElement && !!element.style.verticalAlign
  },
  read(element: Element): AttributeLoaderReadResult<string> {
    return {
      attribute: cellAlignAttr,
      value: (element as any as HTMLTableCellElement).style.verticalAlign!
    }
  }
}
