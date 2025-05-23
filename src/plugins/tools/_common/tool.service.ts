import { Controller, merge, Selection, Subscription } from '@textbus/core'
import { createSignal, Injectable, Signal } from '@viewfly/core'

import { ImageComponent } from '../../../textbus/components/image/image.component'
import { VideoComponent } from '../../../textbus/components/video/video.component'
import { SourceCodeComponent } from '../../../textbus/components/source-code/source-code.component'

export interface CommonState {
  inSourceCode: boolean
  readonly: boolean
  selectEmbed: boolean
}

@Injectable()
export class ToolService {
  state: Signal<CommonState>
  private sub: Subscription

  constructor(selection: Selection,
              controller: Controller) {
    this.state = createSignal({
      inSourceCode: false,
      readonly: controller.readonly,
      selectEmbed: false,
    })
    this.sub = merge(selection.onChange, controller.onReadonlyStateChange).subscribe(() => {
      const { startSlot, endSlot, startOffset, endOffset } = selection
      let is = false
      if (startSlot && startSlot === endSlot && endOffset! - startOffset! === 1) {
        const component = startSlot.getContentAtIndex(startOffset!)
        if (component instanceof VideoComponent || component instanceof ImageComponent) {
          is = true
        }
      }

      this.state.set({
        selectEmbed: is,
        readonly: controller.readonly,
        inSourceCode: selection.commonAncestorComponent instanceof SourceCodeComponent
      })
    })
  }

  destroy() {
    this.sub.unsubscribe()
  }
}
