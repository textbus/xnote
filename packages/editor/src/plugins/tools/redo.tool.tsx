import { getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { History } from '@textbus/core'

import { useCommonState } from './_common/common-state'
import { Button } from '@viewfly/ui-components'

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
    return <Button size={'small'} variant={'text'} inlineCompact={true} disabled={!history.canForward || commonState().readonly} onClick={redo}>
      <span class="xnote-icon-history-forward"></span>
    </Button>
  }
}
