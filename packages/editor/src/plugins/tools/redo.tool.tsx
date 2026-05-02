import { getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { History } from '@textbus/core'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

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
    return <Button size={'small'} variant={'text'} inlineCompact={true} disabled={!history.canForward || commonState().readonly} onClick={redo}>
      <IconGlyph name={'history-forward'}/>
    </Button>
  }
}
