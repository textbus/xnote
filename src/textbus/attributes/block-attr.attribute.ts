import { Attribute, FormatValue, VElement } from '@textbus/core'

import { Matcher, MatchRule } from '../_utils/matcher'
import { blockTags } from '../formatters/_config'
import { AttributeLoader } from '@textbus/platform-browser'

export class BlockAttrLoader<T extends FormatValue> extends Matcher<T, Attribute<T>> implements AttributeLoader<any> {
  constructor(public attrName: string, attribute: Attribute<T>, rule: MatchRule) {
    super(attribute, rule)
  }

  override match(p: HTMLElement) {
    const reg = new RegExp(`^(${blockTags.join('|')})$`, 'i')
    if (!reg.test(p.tagName)) {
      return false
    }
    return super.match(p)
  }

  read(node: HTMLElement) {
    return {
      attribute: this.target,
      value: this.extractFormatData(node, {
        attrs: [this.attrName]
      }).attrs?.[this.attrName] as T
    }
  }
}

export class BlockAttrAttribute implements Attribute<string> {
  constructor(public name: string, public attrName: string) {
  }

  render(host: VElement, formatValue: FormatValue) {
    host.attrs.set(this.attrName, formatValue)
  }
}

export const dirAttribute = new BlockAttrAttribute('dir', 'dir')

// 块级属性
export const dirAttributeLoader = new BlockAttrLoader('dir', dirAttribute, {
  attrs: [{
    key: 'dir',
    value: ['ltr', 'rtl']
  }]
})
