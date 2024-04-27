import {
  Component,
  ComponentStateLiteral,
  ContentType,
  onFocusIn,
  onFocusOut,
  Registry,
  Selection,
  Slot,
  Subject,
  Textbus,
} from '@textbus/core'

import { ParagraphComponent } from '../paragraph/paragraph.component'

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

  constructor(textbus: Textbus, state: TableComponentState = {
    layoutWidth: [200, 200, 200],
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

  override setup() {
    onFocusIn(() => {
      this.focus.next(true)
    })
    onFocusOut(() => {
      this.focus.next(false)
    })
  }

  afterContentCheck() {
    const selection = this.textbus.get(Selection)
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

  insertColumn(index: number) {
    this.state.layoutWidth.splice(index, 0, defaultColumnWidth)
    this.state.rows.forEach(row => {
      row.cells.splice(index, 0, {
        rowspan: 1,
        colspan: 1,
        slot: new Slot([
          ContentType.BlockComponent,
          ContentType.InlineComponent,
          ContentType.Text
        ])
      })
    })
  }

  insertRow(index: number) {
    this.state.rows.splice(index, 0, {
      height: defaultRowHeight,
      cells: this.state.layoutWidth.map(() => {
        return {
          rowspan: 1,
          colspan: 1,
          slot: new Slot([
            ContentType.BlockComponent,
            ContentType.InlineComponent,
            ContentType.Text
          ])
        }
      })
    })
  }
}
