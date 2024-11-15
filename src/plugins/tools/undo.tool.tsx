import { getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { History } from '@textbus/core'

import { Button } from '../../components/button/button'
import { useCommonState } from './_common/common-state'

export function UndoTool() {
  const history = inject(History)
  const instance = getCurrentInstance()

  function undo() {
    history.back()
  }

  const sub = history.onChange.subscribe(() => {
    instance.markAsDirtied()
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()
  return () => {
    return <Button disabled={!history.canBack || commonState().readonly} onClick={undo}>
      <span class="xnote-icon-history-back"></span>
    </Button>
  }
}
