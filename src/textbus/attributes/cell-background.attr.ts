import { Attribute, VElement } from '@textbus/core'
import { AttributeLoader, AttributeLoaderReadResult } from '@textbus/platform-browser'
import { ColorRGBA, hsl2Rgb, parseCss, rgb2Hsl } from '@tanbo/color'

export const cellBackgroundAttr = new Attribute<string>('cellBackground', {
  render(node: VElement, formatValue: string) {
    const rgba = parseCss(formatValue) as ColorRGBA
    if (rgba) {
      const hsl = rgb2Hsl(rgba)
      if (hsl.l > 50) {
        hsl.l -= 10
      } else {
        hsl.l += Math.max((50 - hsl.l) * 0.55, 10)
      }
      hsl.s *= 0.7
      const newRgba = hsl2Rgb(hsl)
      node.styles.set('borderColor', `rgba(${newRgba.r}, ${newRgba.g}, ${newRgba.b}, ${rgba.a})`)
    }
    node.styles.set('backgroundColor', formatValue)
  }
})

export const cellBackgroundAttrLoader: AttributeLoader<string> = {
  match(element: Element): boolean {
    return element instanceof HTMLTableCellElement && !!element.style.backgroundColor
  },
  read(element: Element): AttributeLoaderReadResult<string> {
    return {
      attribute: cellBackgroundAttr,
      value: (element as any as HTMLTableCellElement).style.backgroundColor!
    }
  }
}
