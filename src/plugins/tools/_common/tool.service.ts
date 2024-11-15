import { Controller, merge, Selection, Subscription } from '@textbus/core'
import { useProduce } from '@viewfly/hooks'
import { Injectable, Signal } from '@viewfly/core'

import { SourceCodeComponent } from '../../../textbus/components/source-code/source-code.component'

export interface CommonState {
  inSourceCode: boolean
  readonly: boolean
}

@Injectable()
export class ToolService {
  state: Signal<CommonState>
  private sub: Subscription

  constructor(private selection: Selection,
              private controller: Controller) {
    const [state, updateState] = useProduce({
      inSourceCode: false,
      readonly: controller.readonly
    })
    this.state = state
    this.sub = merge(selection.onChange, controller.onReadonlyStateChange).subscribe(() => {
      updateState(draft => {
        draft.readonly = controller.readonly
        draft.inSourceCode = selection.commonAncestorComponent instanceof SourceCodeComponent
      })
    })
  }

  destroy() {
    this.sub.unsubscribe()
  }
}
