import { inject, onUnmounted } from '@viewfly/core'
import { Commander, Query, QueryStateType, Selection } from '@textbus/core'
import { useProduce } from '@viewfly/hooks'

import { Button } from '../../components/button/button'
import { superscriptFormatter } from '../../textbus/formatters/superscript'
import { subscriptFormatter } from '../../textbus/formatters/subscript'
import { useCommonState } from './_common/common-state'

export function SuperscriptTool() {
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
      <Button disabled={commonState().inSourceCode || commonState().readonly} highlight={state().highlight} onClick={apply}>
        <span class="xnote-icon-superscript"></span>
      </Button>
    )
  }
}
