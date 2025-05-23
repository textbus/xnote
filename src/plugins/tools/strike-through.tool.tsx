import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Query, QueryStateType, Textbus } from '@textbus/core'

import { Button } from '../../components/button/button'
import { RefreshService } from '../../services/refresh.service'
import { strikeThroughFormatter, toggleStrikeThrough } from '../../textbus/formatters/_api'
import { useCommonState } from './_common/common-state'

export function StrikeThroughTool() {
  const query = inject(Query)
  const refreshService = inject(RefreshService)
  const textbus = inject(Textbus)

  const viewModel = reactive({
    highlight: false,
  })

  function toggle() {
    toggleStrikeThrough(textbus)
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const state = query.queryFormat(strikeThroughFormatter)
    viewModel.highlight = state.state === QueryStateType.Enabled
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()
  return () => {
    return <Button highlight={viewModel.highlight}
                   disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
                   onClick={toggle}><span class="xnote-icon-strikethrough"></span></Button>
  }
}
