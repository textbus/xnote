import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Query, QueryStateType, Textbus } from '@textbus/core'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { RefreshService } from '../../services/refresh.service'
import { toggleUnderline, underlineFormatter } from '../../textbus/formatters/_api'
import { useCommonState } from './_common/common-state'

export function UnderlineTool() {
  const query = inject(Query)
  const refreshService = inject(RefreshService)
  const textbus = inject(Textbus)

  const viewModel = reactive({
    highlight: false,
  })

  function toggle() {
    toggleUnderline(textbus)
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const state = query.queryFormat(underlineFormatter)
    viewModel.highlight = state.state === QueryStateType.Enabled
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()
  return () => {
    return <Button inlineCompact={true} chevronGapless={true} variant={'text'} highlighted={viewModel.highlight}
                   size={'small'}
                   disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
                   onClick={toggle}>
      <IconGlyph name={'underline'}/>
    </Button>
  }
}
