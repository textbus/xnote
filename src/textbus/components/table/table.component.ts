import {
  Component,
  ComponentStateLiteral,
  ContentType,
  GetRangesEvent,
  onDestroy,
  onFocusIn,
  onFocusOut,
  onGetRanges,
  Registry,
  Selection,
  Slot,
  Subject,
  Textbus,
  useContext,
} from '@textbus/core'
import { createSignal } from '@viewfly/core'
import { v4 as uuid } from 'uuid'

import { ParagraphComponent } from '../paragraph/paragraph.component'
import { TableSelection } from './components/selection-mask'
import { useBlockContent } from '../../hooks/use-block-content'

export interface TableCellConfig {
  rowspan: number
  colspan: number
  slot: Slot
}

export interface Row {
  height: number
  cells: Slot[]
  id: string
}

export interface ColumnConfig {
  width: number
  id: string
}

export interface TableComponentMergeCellConfig {
  startRowId: string
  startColumnId: string
  endRowId: string
  endColumnId: string
}

export interface TableComponentState {
  columnsConfig: ColumnConfig[]
  rows: Row[]
  mergeConfig: TableComponentMergeCellConfig[]
}

const defaultRowHeight = 30
const defaultColumnWidth = 100

export class TableComponent extends Component<TableComponentState> {
  static componentName = 'TableComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<TableComponentState>) {
    const registry = textbus.get(Registry)
    return new TableComponent(textbus, {
      columnsConfig: json.columnsConfig || [],
      mergeConfig: json.mergeConfig || [],
      rows: json.rows.map<Row>(row => {
        return {
          height: row.height,
          id: row.id,
          cells: row.cells.map(cell => {
            return registry.createSlot(cell)
          })
        }
      })
    })
  }

  private selection = this.textbus.get(Selection)

  constructor(textbus: Textbus, state: TableComponentState = {
    columnsConfig: Array.from<number>({ length: 5 }).map(() => {
      return {
        id: uuid(),
        width: 100
      }
    }),
    mergeConfig: [],
    rows: Array.from({ length: 3 }).map(() => {
      return {
        height: defaultRowHeight,
        id: uuid(),
        cells: Array.from({ length: 5 }).map(() => {
          const p = new ParagraphComponent(textbus)
          const slot = new Slot([ContentType.BlockComponent])
          slot.insert(p)
          return slot
        })
      }
    })
  }) {
    super(textbus, state)
  }

  focus = new Subject<boolean>()
  tableSelection = createSignal<TableSelection | null>(null)

  override getSlots(): Slot[] {
    return this.state.rows.map(i => [...i.cells]).flat()
  }

  override setup() {
    const selection = useContext(Selection)
    onFocusIn(() => {
      this.focus.next(true)
    })
    onFocusOut(() => {
      this.focus.next(false)
    })

    useBlockContent((slot) => {
      return slot.parent === this
    })

    const sub = selection.onChange.subscribe(() => {
      if (selection.commonAncestorComponent !== this || selection.isCollapsed) {
        this.tableSelection.set(null)
      }
    })

    onDestroy(() => {
      sub.unsubscribe()
    })

    const findPosition = (slot: Slot) => {
      let cell: Slot | null = slot
      while (cell?.parent && cell.parent !== this) {
        cell = cell.parentSlot
      }
      if (cell) {
        const rows = this.state.rows
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex].cells
          for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const item = row[colIndex]
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

    const select = (ev: GetRangesEvent<any>, selectPosition: TableSelection | null) => {
      this.tableSelection.set(selectPosition)
      if (selectPosition) {
        const cells: Slot[] = []
        this.state.rows.slice(selectPosition.startRow, selectPosition.endRow).forEach(row => {
          cells.push(...row.cells.slice(selectPosition.startColumn, selectPosition.endColumn))
        })
        ev.useRanges(cells.map(i => {
          return {
            slot: i,
            startIndex: 0,
            endIndex: i.length
          }
        }))
        ev.preventDefault()
      }
    }

    onGetRanges(ev => {
      const startPosition = findPosition(selection.startSlot!)
      const endPosition = findPosition(selection.endSlot!)

      if (startPosition && endPosition) {
        if (startPosition.rowIndex === endPosition.rowIndex && startPosition.colIndex === endPosition.colIndex) {
          if (selection.startSlot === selection.endSlot && selection.startOffset === 0 && selection.endOffset === selection.startSlot?.length) {

            select(ev, {
              startColumn: startPosition.colIndex,
              startRow: startPosition.rowIndex,
              endColumn: endPosition.colIndex + 1,
              endRow: endPosition.rowIndex + 1
            })
            return
          }
          select(ev, null)
          return
        }
        const [startColumn, endColumn] = [startPosition.colIndex, endPosition.colIndex].sort((a, b) => a - b)
        const [startRow, endRow] = [startPosition.rowIndex, endPosition.rowIndex].sort((a, b) => a - b)

        select(ev, {
          startColumn,
          startRow,
          endColumn: endColumn + 1,
          endRow: endRow + 1
        })
      } else {
        select(ev, null)
      }
    })
  }

  // afterContentCheck() {
  //   const selection = this.selection
  //   const rows = this.state.rows
  //   rows.forEach(row => {
  //     row.cells.forEach(cell => {
  //       const slot = cell.slot
  //       if (slot.isEmpty) {
  //         const childSlot = new Slot([
  //           ContentType.Text,
  //           ContentType.InlineComponent
  //         ])
  //         const p = new ParagraphComponent(this.textbus, {
  //           slot: childSlot
  //         })
  //         slot.insert(p)
  //         if (slot === selection.anchorSlot) {
  //           selection.setAnchor(childSlot, 0)
  //         }
  //         if (slot === selection.focusSlot) {
  //           selection.setFocus(childSlot, 0)
  //         }
  //       }
  //     })
  //   })
  // }

  deleteColumn(index: number) {
    this.state.columnsConfig.splice(index, 1)
    this.state.rows.forEach(row => {
      row.cells.splice(index, 1)
    })
    this.selection.unSelect()
  }

  deleteRow(index: number) {
    this.state.rows.splice(index, 1)
    this.selection.unSelect()
  }

  insertColumn(index: number) {
    this.state.columnsConfig.splice(index, 0, {
      id: uuid(),
      width: defaultColumnWidth
    })
    this.state.rows.forEach(row => {
      const slot = new Slot([
        ContentType.BlockComponent,
      ])
      slot.insert(new ParagraphComponent(this.textbus, {
        slot: new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
      }))
      row.cells.splice(index, 0, slot)
    })
    this.textbus.nextTick(() => {
      const slot = this.state.rows[0].cells[index]
      if (slot) {
        this.selection.selectFirstPosition(slot.getContentAtIndex(0) as Component<any>)
      }
    })
  }

  insertRow(index: number) {
    this.state.rows.splice(index, 0, {
      height: defaultRowHeight,
      id: uuid(),
      cells: this.state.columnsConfig.map(() => {
        const slot = new Slot([
          ContentType.BlockComponent,
        ])
        slot.insert(new ParagraphComponent(this.textbus, {
          slot: new Slot([
            ContentType.InlineComponent,
            ContentType.Text
          ])
        }))
        return slot
      })
    })
    this.textbus.nextTick(() => {
      const slot = this.state.rows[index].cells[0]
      if (slot) {
        this.selection.selectFirstPosition(slot.getContentAtIndex(0) as Component<any>)
      }
    })
  }
}
