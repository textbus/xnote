import {
  Component,
  ComponentStateLiteral,
  ContentType,
  onFocusIn,
  onFocusOut, onGetRanges,
  Registry,
  Selection,
  Slot,
  Subject,
  Textbus,
} from '@textbus/core'
import { createSignal } from '@viewfly/core'

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
  cells: TableCellConfig[]
}

export interface TableComponentState {
  layoutWidth: number[]
  rows: Row[]
}

const defaultRowHeight = 30
const defaultColumnWidth = 100

export class TableComponent extends Component<TableComponentState> {
  static componentName = 'TableComponent'
  static type = ContentType.BlockComponent

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<TableComponentState>) {
    const registry = textbus.get(Registry)
    return new TableComponent(textbus, {
      layoutWidth: json.layoutWidth || [],
      rows: json.rows.map<Row>(row => {
        return {
          height: row.height,
          cells: row.cells.map(cell => {
            return {
              colspan: cell.colspan,
              rowspan: cell.rowspan,
              slot: registry.createSlot(cell.slot)
            }
          })
        }
      })
    })
  }

  private selection = this.textbus.get(Selection)

  constructor(textbus: Textbus, state: TableComponentState = {
    layoutWidth: Array.from<number>({ length: 3 }).fill(100),
    rows: Array.from({ length: 3 }).map(() => {
      return {
        height: defaultRowHeight,
        cells: Array.from({ length: 3 }).map(() => {
          return {
            rowspan: 1,
            colspan: 1,
            slot: new Slot([
              ContentType.Text,
              ContentType.InlineComponent,
              ContentType.BlockComponent
            ])
          }
        })
      }
    })
  }) {
    super(textbus, state)
  }

  focus = new Subject<boolean>()
  tableSelection = createSignal<TableSelection | null>(null)

  override setup() {
    onFocusIn(() => {
      this.focus.next(true)
    })
    onFocusOut(() => {
      this.focus.next(false)
    })

    useBlockContent((slot) => {
      return slot.parent === this
    })

    onGetRanges(ev => {
      const selectPosition = this.tableSelection()
      if (selectPosition) {
        const cells: Slot[] = []
        this.state.rows.slice(selectPosition.startRow, selectPosition.endRow + 1).forEach(row => {
          cells.push(...row.cells.slice(selectPosition.startColumn, selectPosition.endColumn + 1).map(i => i.slot))
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
    })
  }

  afterContentCheck() {
    const selection = this.selection
    const rows = this.state.rows
    rows.forEach(row => {
      row.cells.forEach(cell => {
        const slot = cell.slot
        if (slot.isEmpty) {
          const childSlot = new Slot([
            ContentType.Text,
            ContentType.InlineComponent
          ])
          const p = new ParagraphComponent(this.textbus, {
            slot: childSlot
          })
          slot.insert(p)
          if (slot === selection.anchorSlot) {
            selection.setAnchor(childSlot, 0)
          }
          if (slot === selection.focusSlot) {
            selection.setFocus(childSlot, 0)
          }
        }
      })
    })
  }

  deleteColumn(index: number) {
    this.state.layoutWidth.splice(index, 1)
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
    this.state.layoutWidth.splice(index, 0, defaultColumnWidth)
    this.state.rows.forEach(row => {
      const slot = new Slot([
        ContentType.BlockComponent,
        ContentType.InlineComponent,
        ContentType.Text
      ])
      slot.insert(new ParagraphComponent(this.textbus, {
        slot: new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
      }))
      row.cells.splice(index, 0, {
        rowspan: 1,
        colspan: 1,
        slot
      })
    })
    this.textbus.nextTick(() => {
      const slot = this.state.rows[0].cells[index]?.slot
      if (slot) {
        this.selection.selectFirstPosition(slot.getContentAtIndex(0) as Component<any>)
      }
    })
  }

  insertRow(index: number) {
    this.state.rows.splice(index, 0, {
      height: defaultRowHeight,
      cells: this.state.layoutWidth.map(() => {
        const slot = new Slot([
          ContentType.BlockComponent,
          ContentType.InlineComponent,
          ContentType.Text
        ])
        slot.insert(new ParagraphComponent(this.textbus, {
          slot: new Slot([
            ContentType.InlineComponent,
            ContentType.Text
          ])
        }))
        return {
          rowspan: 1,
          colspan: 1,
          slot
        }
      })
    })
    this.textbus.nextTick(() => {
      const slot = this.state.rows[index].cells[0]?.slot
      if (slot) {
        this.selection.selectFirstPosition(slot.getContentAtIndex(0) as Component<any>)
      }
    })
  }
}
