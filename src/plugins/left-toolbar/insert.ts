import { inject } from '@viewfly/core'
import { Commander, ContentType, Selection, Slot, Textbus } from '@textbus/core'

import { ParagraphComponent } from '../../textbus/components/paragraph/paragraph.component'

export function useInsert() {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const textbus = inject(Textbus)
  return function (type: string) {
    if (!selection.isSelected) {
      return
    }
    switch (type) {
      case 'paragraph': {
        const slot = new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
        const p = new ParagraphComponent(textbus, {
          slot
        })
        commander.insertAfter(p, selection.commonAncestorComponent!)
        selection.setPosition(slot, 0)
        return
      }
    }
  }
}
