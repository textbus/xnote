import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Query, QueryStateType, Textbus } from '@textbus/core'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

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
    return <Button variant={'text'} size={'small'} inlineCompact={true} chevronGapless={true}
      highlight={viewModel.highlight}
      disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
      onClick={toggle}>
      <IconGlyph name={'code'}/>
    </Button>
  }
}
