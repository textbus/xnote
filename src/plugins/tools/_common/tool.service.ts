import { Controller, merge, Selection, Subscription } from '@textbus/core'
import { useProduce } from '@viewfly/hooks'
import { Injectable, Signal } from '@viewfly/core'

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

  constructor(private selection: Selection,
              private controller: Controller) {
    const [state, updateState] = useProduce<CommonState>({
      inSourceCode: false,
      readonly: controller.readonly,
      selectEmbed: false,
    })
    this.state = state
    this.sub = merge(selection.onChange, controller.onReadonlyStateChange).subscribe(() => {
      const { startSlot, endSlot, startOffset, endOffset } = selection
      let is = false
      if (startSlot && startSlot === endSlot && endOffset! - startOffset! === 1) {
        const component = startSlot.getContentAtIndex(startOffset!)
        if (component instanceof VideoComponent || component instanceof ImageComponent) {
          is = true
        }
      }
      updateState(draft => {
        draft.selectEmbed = is
        draft.readonly = controller.readonly
        draft.inSourceCode = selection.commonAncestorComponent instanceof SourceCodeComponent
      })
    })
  }

  destroy() {
    this.sub.unsubscribe()
  }
}
