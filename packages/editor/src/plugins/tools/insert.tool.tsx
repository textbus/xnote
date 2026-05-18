import { getCurrentInstance, inject, onUnmounted } from '@viewfly/core'
import { Selection } from '@textbus/core'
import { Button, Dropdown } from '@viewfly/ui-components'

import { InsertMenu } from './insert-menu'
import { useCommonState } from './_common/common-state'
import { I18nService } from '../../services/i18n.service'

export function InsertTool() {
  const i18n = inject(I18nService)
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
        <InsertMenu replace={false} hideTitle={false} component={selection.focusSlot?.parent}/>
      }>
        <Button size={'small'}
                variant={'text'}
                class="xnote-text-nowrap"
                inlineCompact={true}
                chevronGapless={true}
                disabled={b}>{i18n.t('insert.button')}</Button>
      </Dropdown>
    )
  }
}
