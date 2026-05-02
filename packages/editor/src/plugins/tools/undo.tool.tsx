import { getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { History } from '@textbus/core'

import { useCommonState } from './_common/common-state'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

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
    return <Button size={'small'} inlineCompact={true} variant={'text'} disabled={!history.canBack || commonState().readonly} onClick={undo}>
      <IconGlyph name={'history-back'}/>
    </Button>
  }
}
