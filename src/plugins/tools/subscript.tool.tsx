import { inject, onUnmounted } from '@viewfly/core'
import { Commander, Query, QueryStateType, Selection } from '@textbus/core'
import { useProduce } from '@viewfly/hooks'

import { Button } from '../../components/button/button'
import { subscriptFormatter } from '../../textbus/formatters/subscript'
import { superscriptFormatter } from '../../textbus/formatters/superscript'
import { useCommonState } from './_common/common-state'

export function SubscriptTool() {
  const query = inject(Query)
  const selection = inject(Selection)
  const commander = inject(Commander)

  const [state, updateState] = useProduce({
    highlight: false
  })

  const sub = selection.onChange.subscribe(() => {
    updateState(draft => {
      draft.highlight = getState()
    })
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
        disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
        highlight={state().highlight}
        onClick={apply}>
        <span class="xnote-icon-subscript"></span>
      </Button>
    )
  }
}
