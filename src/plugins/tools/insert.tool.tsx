import { getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { Selection } from '@textbus/core'

import { Dropdown } from '../../components/dropdown/dropdown'
import { InsertMenu } from './insert-menu'
import { Button } from '../../components/button/button'
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
      <Dropdown disabled={b} menu={
        <InsertMenu replace={false} hideTitle={true} slot={selection.focusSlot}/>
      }>
        <Button disabled={b} arrow={true}>插入</Button>
      </Dropdown>
    )
  }
}
