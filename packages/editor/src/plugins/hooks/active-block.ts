import { Component, Query, QueryStateType, Range, Selection, Slot } from '@textbus/core'
import { inject, onUnmounted, reactive } from '@viewfly/core'

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
  const selection = inject(Selection)
  const refreshService = inject(RefreshService)
  const checkStates = reactive({
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

  function updateCheckStates(range: Range) {
    const heading = query.queryAttributeByRange(headingAttr, range)
    checkStates.paragraph = query.queryComponentByRange(ParagraphComponent, range).state === QueryStateType.Enabled
    checkStates.h1 = checkStates.h2 = checkStates.h3 = checkStates.h4 = checkStates.h5 = checkStates.h6 = false
    if (heading.state === QueryStateType.Enabled) {
      checkStates[heading.value as any] = true
      checkStates.paragraph = false
    }
    const queryList = query.queryComponentByRange(ListComponent, range)
    checkStates.unorderedList = queryList.state === QueryStateType.Enabled && queryList.value!.state.type === 'UnorderedList'
    checkStates.orderedList = queryList.state === QueryStateType.Enabled && queryList.value!.state.type === 'OrderedList'
    checkStates.table = query.queryComponentByRange(TableComponent, range).state === QueryStateType.Enabled
    checkStates.todolist = query.queryComponentByRange(TodolistComponent, range).state === QueryStateType.Enabled
    checkStates.blockquote = query.queryComponentByRange(BlockquoteComponent, range).state === QueryStateType.Enabled
    checkStates.sourceCode = query.queryComponentByRange(SourceCodeComponent, range).state === QueryStateType.Enabled
  }

  const subscription = refreshService.onRefresh.subscribe(() => {
    if (!selection.isSelected) {
      return
    }
    updateCheckStates({
      startOffset: selection.startOffset!,
      startSlot: selection.startSlot!,
      endSlot: selection.endSlot!,
      endOffset: selection.endOffset!
    })
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  return function (component: Component<any> | null = null) {
    if (component) {
      const slots = component.slots
      const last = slots[slots.length - 1]
      updateCheckStates({
        startOffset: 0,
        endOffset: last.length,
        startSlot: slots[0],
        endSlot: last
      })
    } else if (selection.isSelected) {
      updateCheckStates({
        startOffset: selection.startOffset!,
        startSlot: selection.startSlot!,
        endSlot: selection.endSlot!,
        endOffset: selection.endOffset!
      })
    }
    return checkStates
  }
}
