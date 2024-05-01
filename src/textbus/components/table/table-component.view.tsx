import { ContentType, createVNode, Selection, Slot, Textbus } from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { createRef, createSignal, inject, onMounted, onUnmounted, provide } from '@viewfly/core'

import './table.component.scss'
import { TableCellConfig, TableComponent } from './table.component'
import { ResizeColumn } from './components/resize-column'
import { TopBar } from './components/top-bar'
import { Scroll } from './components/scroll'
import { LeftBar } from './components/left-bar'
import { TableService } from './table.service'
import { ResizeRow } from './components/resize-row'
import { SelectionMask } from './components/selection-mask'
import { deltaToBlock } from '../paragraph/paragraph.component'

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
          if (selection.startSlot === selection.endSlot && selection.startOffset === 0 && selection.endOffset === selection.startSlot?.length) {
            props.component.tableSelection.set({
              startColumn: startPosition.colIndex,
              startRow: startPosition.rowIndex,
              endColumn: endPosition.colIndex + 1,
              endRow: endPosition.rowIndex + 1
            })
            return
          }
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
      <div class="xnote-table" data-component={props.component.name} data-layout-width={state.layoutWidth}
           ref={props.rootRef}>
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
    return element.dataset.component === TableComponent.componentName || element.tagName === 'TABLE'
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): TableComponent | Slot | void {
    if (element.tagName === 'DIV') {
      element = element.querySelector('.xnote-table-content') as HTMLTableElement
    }
    const { tHead, tBodies, tFoot } = element as HTMLTableElement
    const headers: TableCellConfig[][] = []
    const bodies: TableCellConfig[][] = []
    if (tHead) {
      Array.from(tHead.rows).forEach(row => {
        const arr: TableCellConfig[] = []
        headers.push(arr)
        Array.from(row.cells).forEach(cell => {
          const slot = new Slot([
            ContentType.BlockComponent,
            ContentType.InlineComponent,
            ContentType.Text
          ])
          arr.push({
            slot,
            rowspan: cell.rowSpan,
            colspan: cell.colSpan
          })
          const delta = slotParser(new Slot([
            ContentType.BlockComponent,
            ContentType.InlineComponent,
            ContentType.Text
          ]), cell).toDelta()

          const results = deltaToBlock(delta, textbus)
          results.forEach(i => {
            slot.insert(i)
          })
        })
      })
    }

    if (tBodies) {
      Array.of(...Array.from(tBodies), tFoot || { rows: [] }).reduce((value, next) => {
        return value.concat(Array.from(next.rows))
      }, [] as HTMLTableRowElement[]).forEach((row: HTMLTableRowElement) => {
        const arr: TableCellConfig[] = []
        bodies.push(arr)
        Array.from(row.cells).forEach(cell => {
          const slot = new Slot([
            ContentType.BlockComponent,
            ContentType.InlineComponent,
            ContentType.Text
          ])
          arr.push({
            slot,
            rowspan: cell.rowSpan,
            colspan: cell.colSpan
          })
          const delta = slotParser(new Slot([
            ContentType.BlockComponent,
            ContentType.InlineComponent,
            ContentType.Text
          ]), cell).toDelta()

          const results = deltaToBlock(delta, textbus)
          results.forEach(i => {
            slot.insert(i)
          })
        })
      })
    }
    bodies.unshift(...headers)

    const cells = autoComplete(bodies)

    let layoutWidth: number[] | null = null

    try {
      const columnWidth = JSON.parse(element.dataset.layoutWidth || '')
      if (Array.isArray(columnWidth)) {
        layoutWidth = columnWidth
      }
    } catch (e) {
      //
    }

    if (!layoutWidth) {
      layoutWidth = Array.from<number>({ length: cells[0].length }).fill(100)
    }


    return new TableComponent(textbus, {
      rows: cells.map(i => {
        return {
          height: 30,
          cells: i
        }
      }),
      layoutWidth
    })
  }
}


export function autoComplete(table: TableCellConfig[][]) {
  const newTable: TableCellConfig[][] = []

  table.forEach((tr, rowIndex) => {
    if (!newTable[rowIndex]) {
      newTable[rowIndex] = []
    }
    const row = newTable[rowIndex]

    let startColumnIndex = 0

    tr.forEach(td => {
      while (row[startColumnIndex]) {
        startColumnIndex++
      }

      let maxColspan = 1

      while (maxColspan < td.colspan) {
        if (!row[startColumnIndex + maxColspan]) {
          maxColspan++
        } else {
          break
        }
      }

      td.colspan = maxColspan

      for (let i = rowIndex, len = td.rowspan + rowIndex; i < len; i++) {
        if (!newTable[i]) {
          newTable[i] = []
        }
        const row = newTable[i]

        for (let j = startColumnIndex, max = startColumnIndex + maxColspan; j < max; j++) {
          row[j] = td
        }
      }

      startColumnIndex += maxColspan
    })
  })

  const maxColumns = Math.max(...newTable.map(i => i.length))
  newTable.forEach(tr => {
    for (let i = 0; i < maxColumns; i++) {
      if (!tr[i]) {
        tr[i] = {
          rowspan: 1,
          colspan: 1,
          slot: new Slot([
            ContentType.Text,
            ContentType.InlineComponent,
            ContentType.BlockComponent
          ])
        }
      }
    }
  })

  const recordCells: TableCellConfig[] = []

  return newTable.map(tr => {
    return tr.filter(td => {
      const is = recordCells.includes(td)
      if (is) {
        return false
      }
      recordCells.push(td)
      return true
    })
  })
}
