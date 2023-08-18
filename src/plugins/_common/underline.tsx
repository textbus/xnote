import { useProduce } from '@viewfly/hooks'
import { inject, onUnmounted } from '@viewfly/core'
import { Commander, Query, QueryStateType } from '@textbus/core'

import { Button } from '../../components/button'
import { RefreshService } from '../../services/refresh.service'
import { underlineFormatter } from '../../textbus/formatters/inline-element.formatter'

export function Underline() {
  const query = inject(Query)
  const refreshService = inject(RefreshService)
  const commander = inject(Commander)

  const [viewModel, update] = useProduce({
    highlight: false,
    disabled: false,
  })

  function toggle() {
    const state = query.queryFormat(underlineFormatter)

    if (state.state === QueryStateType.Normal) {
      commander.applyFormat(underlineFormatter, true)
    } else {
      commander.unApplyFormat(underlineFormatter)
    }
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const state = query.queryFormat(underlineFormatter)
    update(draft => {
      draft.highlight = state.state === QueryStateType.Enabled
    })
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  return () => {
    const vm = viewModel()
    return <Button highlight={vm.highlight} disabled={vm.disabled} onClick={toggle}>下划线</Button>
  }
}
