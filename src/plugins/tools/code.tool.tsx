import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Query, QueryStateType, Textbus } from '@textbus/core'

import { Button } from '../../components/button/button'
import { RefreshService } from '../../services/refresh.service'
import { codeFormatter, toggleCode } from '../../textbus/formatters/_api'
import { useCommonState } from './_common/common-state'

export function CodeTool() {
  const query = inject(Query)
  const refreshService = inject(RefreshService)
  const textbus = inject(Textbus)
  const commonState = useCommonState()

  const viewModel = reactive({
    highlight: false,
  })

  function toggle() {
    toggleCode(textbus)
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const state = query.queryFormat(codeFormatter)
    viewModel.highlight = state.state === QueryStateType.Enabled
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  return () => {
    return <Button
      highlight={viewModel.highlight}
      disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
      onClick={toggle}>
      <span class="xnote-icon-code"></span>
    </Button>
  }
}
