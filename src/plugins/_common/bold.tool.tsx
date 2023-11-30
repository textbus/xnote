import { useProduce } from '@viewfly/hooks'
import { inject, onUnmounted } from '@viewfly/core'
import { Query, QueryStateType } from '@textbus/core'

import { Button } from '../../components/button/button'
import { RefreshService } from '../../services/refresh.service'
import { boldFormatter } from '../../textbus/formatters/_api'

export function BoldTool() {
  const query = inject(Query)
  const refreshService = inject(RefreshService)

  const [viewModel, update] = useProduce({
    highlight: false,
    disabled: false,
  })

  const sub = refreshService.onRefresh.subscribe(() => {
    const state = query.queryFormat(boldFormatter)
    update(draft => {
      draft.highlight = state.state === QueryStateType.Enabled
    })
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  function toggle() {
    boldFormatter.toggle()
  }

  return () => {
    const vm = viewModel()
    return <Button highlight={vm.highlight} disabled={vm.disabled} onClick={toggle}><span class="xnote-icon-bold"></span></Button>
  }
}
