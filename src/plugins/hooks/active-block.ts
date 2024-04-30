import { useProduce } from '@viewfly/hooks'
import { Query, QueryStateType } from '@textbus/core'
import { inject, InjectFlags, onUnmounted, THROW_IF_NOT_FOUND } from '@viewfly/core'

import { headingAttr } from '../../textbus/attributes/heading.attr'
import { RefreshService } from '../../services/refresh.service'
import { ParagraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { TableComponent } from '../../textbus/components/table/table.component'
import { TodolistComponent } from '../../textbus/components/todolist/todolist.component'
import { BlockquoteComponent } from '../../textbus/components/blockqoute/blockquote.component'
import { SourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { ListComponent } from '../../textbus/components/list/list.component'

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
    orderedList: false,
    unorderedList: false,
    table: false,
    todolist: false,
    blockquote: false,
    sourceCode: false,
    highlightBox: false
  })

  function updateCheckStates() {
    setCheckStates(draft => {
      const heading = query.queryAttribute(headingAttr)
      draft.paragraph = query.queryComponent(ParagraphComponent).state === QueryStateType.Enabled
      draft.h1 = draft.h2 = draft.h3 = draft.h4 = draft.h5 = draft.h6 = false
      if (heading.state === QueryStateType.Enabled) {
        draft[heading.value as any] = true
        draft.paragraph = false
      }
      const queryList = query.queryComponent(ListComponent)
      draft.unorderedList = queryList.state === QueryStateType.Enabled && queryList.value!.state.type === 'UnorderedList'
      draft.orderedList = queryList.state === QueryStateType.Enabled && queryList.value!.state.type === 'OrderedList'
      draft.table = query.queryComponent(TableComponent).state === QueryStateType.Enabled
      draft.todolist = query.queryComponent(TodolistComponent).state === QueryStateType.Enabled
      draft.blockquote = query.queryComponent(BlockquoteComponent).state === QueryStateType.Enabled
      draft.sourceCode = query.queryComponent(SourceCodeComponent).state === QueryStateType.Enabled
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
