import {
  createVNode,
  Selection,
  Slot,
  Textbus
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader, DomAdapter } from '@textbus/platform-browser'
import { inject, onUnmounted, createSignal, createRef, provide, onMounted } from '@viewfly/core'

import './table.component.scss'
import { TableComponent } from './table.component'
import { ResizeColumn } from './components/resize-column'
import { TopBar } from './components/top-bar'
import { Scroll } from './components/scroll'
import { LeftBar } from './components/left-bar'
import { TableService } from './table.service'
import { ResizeRow } from './components/resize-row'
import { SelectionMask } from './components/selection-mask'

export function TableComponentView(props: ViewComponentProps<TableComponent>) {
  const adapter = inject(DomAdapter)
  const isFocus = createSignal(false)
  provide(TableService)
  const subscription = props.component.focus.subscribe(b => {
    isFocus.set(b)
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const tableRef = createRef<HTMLTableElement>()
  const scrollRef = createRef<HTMLDivElement>()

  const isResizeColumn = createSignal(false)

  const selection = inject(Selection)

  const findPosition = (slot: Slot) => {
    let cell: Slot | null = slot
    while (cell?.parent && cell.parent !== props.component) {
      cell = cell.parentSlot
    }
    if (cell) {
      const rows = props.component.state.rows
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex].cells
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const item = row[colIndex].slot
          if (item === cell) {
            return {
              rowIndex,
              colIndex
            }
          }
        }
      }
    }
    return null
  }

  onMounted(() => {
    const sub = selection.onChange.subscribe(() => {
      if (selection.commonAncestorComponent !== props.component || selection.isCollapsed) {
        props.component.tableSelection.set(null)
        return
      }

      const startPosition = findPosition(selection.startSlot!)
      const endPosition = findPosition(selection.endSlot!)

      if (startPosition && endPosition) {
        if (startPosition.rowIndex === endPosition.rowIndex && startPosition.colIndex === endPosition.colIndex) {
          props.component.tableSelection.set(null)
          return
        }
        const [startColumn, endColumn] = [startPosition.colIndex, endPosition.colIndex].sort((a, b) => a - b)
        const [startRow, endRow] = [startPosition.rowIndex, endPosition.rowIndex].sort((a, b) => a - b)
        props.component.tableSelection.set({
          startColumn,
          startRow,
          endColumn: endColumn + 1,
          endRow: endRow + 1
        })
      } else {
        props.component.tableSelection.set(null)
      }
    })

    return () => sub.unsubscribe()
  })

  return () => {
    const state = props.component.state
    const rows = state.rows

    Promise.resolve().then(() => {
      props.component.afterContentCheck()
    })
    return (
      <div class="xnote-table" data-component={props.component.name} ref={props.rootRef}>
        <TopBar
          isFocus={isFocus}
          component={props.component}
          scrollRef={scrollRef}/>
        <LeftBar
          tableRef={tableRef}
          isFocus={isFocus}
          component={props.component}/>
        <Scroll scrollRef={scrollRef} isFocus={isFocus}>
          <div class="xnote-table-container">
            <table ref={tableRef} class={[
              'xnote-table-content',
              {
                'hide-selection': props.component.tableSelection()
              }
            ]}>
              <colgroup>
                {
                  state.layoutWidth.map(w => {
                    return <col style={{ width: w + 'px', minWidth: w + 'px' }}/>
                  })
                }
              </colgroup>
              <tbody>
              {
                rows.map((row) => {
                  return (
                    <tr>
                      {
                        row.cells.map(cell => {
                          return adapter.slotRender(cell.slot, children => {
                            return createVNode('td', null, children)
                          }, false)
                        })
                      }
                    </tr>
                  )
                })
              }
              </tbody>
            </table>
            <ResizeColumn
              tableRef={tableRef}
              component={props.component}
              onActiveStateChange={isActive => {
                isResizeColumn.set(isActive)
              }}/>
            <SelectionMask tableRef={tableRef} component={props.component}/>
          </div>
        </Scroll>
        <ResizeRow component={props.component} tableRef={tableRef}/>
      </div>
    )
  }
}

export const tableComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.component === TableComponent.componentName
  },
  read(element: HTMLElement, textbus: Textbus): TableComponent | Slot | void {
    return new TableComponent(textbus)
  }
}
