import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Query, QueryStateType, Textbus } from '@textbus/core'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { RefreshService } from '../../services/refresh.service'
import { boldFormatter, toggleBold } from '../../textbus/formatters/_api'
import { useCommonState } from './_common/common-state'

export function BoldTool() {
  const query = inject(Query)
  const textbus = inject(Textbus)
  const refreshService = inject(RefreshService)

  const commonState = useCommonState()

  const viewModel = reactive({
    highlight: false,
  })

  function toggle() {
    toggleBold(textbus)
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const state = query.queryFormat(boldFormatter)
    viewModel.highlight = state.state === QueryStateType.Enabled
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  return () => {
    return <Button inlineCompact={true} chevronGapless={true} variant={'text'} highlight={viewModel.highlight}
                   size={'small'}
                   disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
                   onClick={toggle}>
      <IconGlyph name={'bold'}/>
    </Button>
  }
}
