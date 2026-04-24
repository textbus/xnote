import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Commander, Query, QueryStateType, Selection } from '@textbus/core'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { subscriptFormatter } from '../../textbus/formatters/subscript'
import { superscriptFormatter } from '../../textbus/formatters/superscript'
import { useCommonState } from './_common/common-state'

export function SubscriptTool() {
  const query = inject(Query)
  const selection = inject(Selection)
  const commander = inject(Commander)

  const state = reactive({
    highlight: false
  })

  const sub = selection.onChange.subscribe(() => {
    state.highlight = getState()
  })

  function getState() {
    const s = query.queryFormat(subscriptFormatter)
    return s.state === QueryStateType.Enabled
  }

  onUnmounted(() => {
    sub.unsubscribe()
  })

  function apply() {
    const is = getState()
    if (is) {
      commander.unApplyFormat(subscriptFormatter)
    } else {
      commander.unApplyFormat(superscriptFormatter)
      commander.applyFormat(subscriptFormatter, true)
    }
  }

  const commonState = useCommonState()
  return () => {
    return (
      <Button
        size={'small'}
        variant={'text'}
        chevronGapless={true}
        inlineCompact={true}
        disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
        highlight={state.highlight}
        onClick={apply}>
        <IconGlyph name={'subscript'}/>
      </Button>
    )
  }
}
