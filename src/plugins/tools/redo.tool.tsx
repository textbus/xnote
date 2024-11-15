import { getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { History } from '@textbus/core'

import { Button } from '../../components/button/button'
import { useCommonState } from './_common/common-state'

export function RedoTool() {
  const history = inject(History)
  const instance = getCurrentInstance()

  function redo() {
    history.forward()
  }

  const sub = history.onChange.subscribe(() => {
    instance.markAsDirtied()
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()
  return () => {
    return <Button disabled={!history.canForward || commonState().readonly} onClick={redo}>
      <span class="xnote-icon-history-forward"></span>
    </Button>
  }
}
