import { getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { Selection } from '@textbus/core'
import { Button, Dropdown } from '@viewfly/ui-components'

import { InsertMenu } from './insert-menu'
import { useCommonState } from './_common/common-state'

export function InsertTool() {
  const selection = inject(Selection)
  const instance = getCurrentInstance()
  const sub = selection.onChange.subscribe(() => {
    instance.markAsDirtied()
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })
  const commonState = useCommonState()
  return () => {
    const b = commonState().readonly
    return (
      <Dropdown trigger={'hover'} disabled={b} dropdown={
        <InsertMenu replace={false} hideTitle={false} slot={selection.focusSlot}/>
      }>
        <Button size={'small'}
                variant={'text'}
                inlineCompact={true}
                chevronGapless={true}
                disabled={b} arrow={true}>插入</Button>
      </Dropdown>
    )
  }
}
