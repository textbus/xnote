import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Query, QueryStateType, Textbus } from '@textbus/core'

import { Button } from '../../components/button/button'
import { RefreshService } from '../../services/refresh.service'
import { italicFormatter, toggleItalic } from '../../textbus/formatters/_api'
import { useCommonState } from './_common/common-state'

export function ItalicTool() {
  const query = inject(Query)
  const refreshService = inject(RefreshService)
  const textbus = inject(Textbus)

  const viewModel = reactive({
    highlight: false,
  })

  function toggle() {
    toggleItalic(textbus)
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const state = query.queryFormat(italicFormatter)
    viewModel.highlight = state.state === QueryStateType.Enabled
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()
  return () => {
    return <Button highlight={viewModel.highlight}
                   disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
                   onClick={toggle}><span
      class="xnote-icon-italic"></span></Button>
  }
}
