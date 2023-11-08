import { useProduce } from '@viewfly/hooks'
import { Query, QueryStateType } from '@textbus/core'
import { inject, InjectFlags, onUnmounted, THROW_IF_NOT_FOUND } from '@viewfly/core'

import { headingAttr } from '../../textbus/attributes/heading.attr'
import { paragraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { todolistComponent } from '../../textbus/components/todolist/todolist.component'
import { blockquoteComponent } from '../../textbus/components/blockqoute/blockquote.component'
import { sourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { RefreshService } from '../../services/refresh.service'
import { tableComponent } from '../../textbus/components/table/table.component'

export function useActiveBlock() {
  const query = inject(Query)
  const refreshService = inject(RefreshService, THROW_IF_NOT_FOUND, InjectFlags.Default)
  const [checkStates, setCheckStates] = useProduce({
    paragraph: false,
    h1: false,
    h2: false,
    h3: false,
    h4: false,
    h5: false,
    h6: false,
    table: false,
    todolist: false,
    blockquote: false,
    sourceCode: false
  })

  function updateCheckStates() {
    setCheckStates(draft => {
      const heading = query.queryAttribute(headingAttr)
      draft.paragraph = query.queryComponent(paragraphComponent).state === QueryStateType.Enabled
      draft.h1 = draft.h2 = draft.h3 = draft.h4 = draft.h5 = draft.h6 = false
      if (heading.state === QueryStateType.Enabled) {
        draft[heading.value as any] = true
        draft.paragraph = false
      }
      draft.table = query.queryComponent(tableComponent).state === QueryStateType.Enabled
      draft.todolist = query.queryComponent(todolistComponent).state === QueryStateType.Enabled
      draft.blockquote = query.queryComponent(blockquoteComponent).state === QueryStateType.Enabled
      draft.sourceCode = query.queryComponent(sourceCodeComponent).state === QueryStateType.Enabled
    })
  }

  updateCheckStates()

  const subscription = refreshService.onRefresh.subscribe(() => {
    updateCheckStates()
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  return checkStates
}
