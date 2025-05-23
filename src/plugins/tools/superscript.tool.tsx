import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Commander, Query, QueryStateType, Selection } from '@textbus/core'

import { Button } from '../../components/button/button'
import { superscriptFormatter } from '../../textbus/formatters/superscript'
import { subscriptFormatter } from '../../textbus/formatters/subscript'
import { useCommonState } from './_common/common-state'

export function SuperscriptTool() {
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
    const s = query.queryFormat(superscriptFormatter)
    return s.state === QueryStateType.Enabled
  }

  onUnmounted(() => {
    sub.unsubscribe()
  })

  function apply() {
    const is = getState()
    if (is) {
      commander.unApplyFormat(superscriptFormatter)
    } else {
      commander.unApplyFormat(subscriptFormatter)
      commander.applyFormat(superscriptFormatter, true)
    }
  }

  const commonState = useCommonState()
  return () => {
    return (
      <Button
        disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
        highlight={state.highlight}
        onClick={apply}>
        <span class="xnote-icon-superscript"></span>
      </Button>
    )
  }
}
