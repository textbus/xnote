import { VElement, Attribute, FormatValue } from '@textbus/core'

import { Matcher, MatchRule } from '../_utils/matcher'
import { blockTags } from '../formatters/_config'
import { AttributeLoader } from '@textbus/platform-browser'

export class BlockStyleAttrLoader<T extends FormatValue> extends Matcher<T, Attribute<T>> implements AttributeLoader<T> {
  constructor(public styleName: string, formatter: Attribute<any>, rule: MatchRule) {
    super(formatter, rule)
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
        styleName: this.styleName
      }).styles[this.styleName] as T
    }
  }
}

export class BlockStyleAttribute implements Attribute<string> {
  constructor(public name: string,
              public styleName: string) {
  }

  render(host: VElement, formatValue: string) {
    host.styles.set(this.styleName, formatValue)
  }
}

// 块级样式
export const textIndentAttribute = new BlockStyleAttribute('textIndent', 'textIndent')
export const textAlignAttribute = new BlockStyleAttribute('textAlign', 'textAlign')
export const blockBackgroundColorAttribute = new BlockStyleAttribute('blockBackgroundColor', 'backgroundColor')
export const textIndentAttributeLoader = new BlockStyleAttrLoader('textIndent', textIndentAttribute, {
  styles: {
    textIndent: /.+/
  }
})
export const textAlignAttributeLoader = new BlockStyleAttrLoader('textAlign', textAlignAttribute, {
  styles: {
    textAlign: /.+/
  }
})

export const blockBackgroundColorAttributeLoader = new BlockStyleAttrLoader('backgroundColor', blockBackgroundColorAttribute, {
  styles: {
    backgroundColor: /.+/
  }
})
