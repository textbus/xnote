import { Component, ComponentStateLiteral, ContentType, Registry, Slot, Textbus } from '@textbus/core'

import { ParagraphComponent } from '../paragraph/paragraph.component'
import { fontSizeFormatter } from '../../formatters/font-size'
import { boldFormatter } from '../../formatters/bold'
import { colorFormatter } from '../../formatters/color'

export interface TimelineComponentItem {
  theme: string
  slot: Slot
}

export interface TimelineComponentState {
  items: TimelineComponentItem[]
}

export function createTimelineItem(theme: string, i18n: { t: (key: string) => string }): TimelineComponentItem {
  const slot = new Slot([
    ContentType.BlockComponent,
  ])

  const title = new ParagraphComponent()
  title.state.slot.insert(i18n.t('timeline.defaultTheme'), [
    [fontSizeFormatter, '18px'],
    [boldFormatter, true]
  ])
  title.state.slot.insert(i18n.t('timeline.dateSample'), [
    [fontSizeFormatter, '15px'],
    [colorFormatter, '#777']
  ])

  const desc = new ParagraphComponent()
  desc.state.slot.insert(i18n.t('timeline.defaultDesc'))
  slot.insert(title)
  slot.insert(desc)
  return { theme, slot }
}

export class TimelineComponent extends Component<TimelineComponentState> {
  static componentName = 'TimelineComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<TimelineComponentState>): TimelineComponent {
    const registry = textbus.get(Registry)

    return new TimelineComponent({
      items: json.items.map(i => {
        return {
          theme: i.theme,
          slot: registry.createSlot(i.slot)
        }
      })
    })
  }

  override getSlots(): Slot[] {
    return this.state.items.map(i => i.slot)
  }

  override removeSlot(slot: Slot): boolean {
    const index = this.state.items.findIndex(i => i.slot === slot)
    if (index >= 0) {
      this.state.items.splice(index, 1)
      return true
    }
    return false
  }
}
