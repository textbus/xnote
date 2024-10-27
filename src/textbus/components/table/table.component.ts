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
  Slot, SlotRange,
  Subject,
  Textbus,
  useContext,
} from '@textbus/core'
import { createSignal } from '@viewfly/core'
import { v4 } from 'uuid'

import { ParagraphComponent } from '../paragraph/paragraph.component'
import { TableSelection } from './components/selection-mask'
import { useBlockContent } from '../../hooks/use-block-content'
import { applyRectangles, findNonIntersectingRectangles, getMaxRectangle, Rectangle, RenderRow } from './tools/merge'

export interface Cell {
  id: string
  slot: Slot
}

export interface Row {
  height: number
  cells: Cell[]
}

export type TableComponentMergeCellConfig = Record<string, string>

export interface TableComponentState {
  columnsConfig: number[]
  rows: Row[]
  mergeConfig: TableComponentMergeCellConfig
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
          cells: row.cells.map(cell => {
            return {
              id: cell.id,
              slot: registry.createSlot(cell.slot)
            }
          })
        }
      })
    })
  }

  private selection = this.textbus.get(Selection)

  constructor(textbus: Textbus, state: TableComponentState = {
    columnsConfig: Array.from<number>({ length: 5 }).fill(defaultColumnWidth),
    mergeConfig: {},
    rows: Array.from({ length: 3 }).map(() => {
      return {
        height: defaultRowHeight,
        cells: Array.from({ length: 5 }).map(() => {
          const p = new ParagraphComponent(textbus)
          const slot = new Slot([ContentType.BlockComponent])
          slot.insert(p)
          return {
            slot,
            id: v4()
          }
        })
      }
    })
  }) {
    super(textbus, state)
  }

  focus = new Subject<boolean>()
  tableSelection = createSignal<TableSelection | null>(null)

  private normalizedData: RenderRow[] = []

  override getSlots(): Slot[] {
    return this.normalizedData.map(item => {
      return item.cells.filter(i => i.visible).map(i => i.raw.slot)
    }).flat()
  }

  merge(startCell: Cell, endCell: Cell) {
    const slots = this.getSlots()
    const index1 = slots.findIndex(i => i === startCell.slot)
    const index2 = slots.findIndex(i => i === endCell.slot)
    if (index1 > -1 && index2 > -1) {
      if (index1 < index2) {
        this.state.mergeConfig[startCell.id] = endCell.id
      } else {
        this.state.mergeConfig[endCell.id] = startCell.id
      }
    }
  }

  getMaxRectangle(startSlot: Slot, endSlot: Slot): Rectangle | null {
    let index1 = -1
    let index2 = -1

    let x1 = -1
    let x2 = -1
    let y1 = -1
    let y2 = -1

    let index = 0
    for (let i = 0; i < this.state.rows.length; i++) {
      const row = this.state.rows[i]
      for (let j = 0; j < row.cells.length; j++) {
        const item = row.cells[j]
        if (item.slot === startSlot) {
          index1 = index
          x1 = j
          y1 = i
        }
        if (item.slot === endSlot) {
          index2 = index
          x2 = j
          y2 = i
        }
        index++
      }
    }
    if (index1 === -1 || index2 === -1) {
      return null
    }

    if (x1 > x2) {
      [x1, x2] = [x2, x1]
    }
    if (y1 > y2) {
      [y1, y2] = [y2, y1]
    }

    return getMaxRectangle(new Rectangle(x1, y1, x2 + 1, y2 + 1), this.getMergedRectangles())
  }

  getSelectedNormalizedSlots(startSlot: Slot, endSlot: Slot): RenderRow[] {
    const rectangle = this.getMaxRectangle(startSlot, endSlot)
    if (!rectangle) {
      return []
    }
    return this.getSelectedNormalizedSlotsByRectangle(rectangle)
  }

  getSelectedNormalizedSlotsByRectangle(rectangle: Rectangle) {
    return this.normalizedData.slice(rectangle.y1, rectangle.y2).map(item => {
      return {
        row: item.row,
        cells: item.cells.slice(rectangle.x1, rectangle.x2)
      }
    })
  }

  getCellBySlot(slot: Slot): Cell | null {
    for (const row of this.state.rows) {
      for (const cell of row.cells) {
        if (cell.slot === slot) {
          return cell
        }
      }
    }
    return null
  }

  split(startCell: Cell) {
    Reflect.deleteProperty(this.state.mergeConfig, startCell.id)
  }

  getNormalizedData() {
    if (!this.changeMarker.dirty) {
      return this.normalizedData
    }

    const nonIntersectingRectangles = this.getMergedRectangles()
    this.normalizedData = applyRectangles(this.state.rows, nonIntersectingRectangles)
    return this.normalizedData
  }

  private getMergedRectangles() {
    const rectangles: Rectangle[] = []
    Object.entries(this.state.mergeConfig).forEach(([key, value]) => {
      const p1 = this.getCoordinateById(key)
      if (p1) {
        const p2 = this.getCoordinateById(value)
        if (p2) {
          rectangles.push(new Rectangle(p1[0], p1[1], p2[0] + 1, p2[1] + 1))
        }
      }
    })
    return findNonIntersectingRectangles(rectangles)
  }

  private getCoordinateById(id: string) {
    const rows = this.state.rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const colIndex = row.cells.findIndex(i => i.id === id)
      if (colIndex > -1) {
        return [colIndex, i]
      }
    }
    return null
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

    const getSelfSlot = (slot: Slot): Slot | null => {
      let cell: Slot | null = slot
      while (cell?.parent && cell.parent !== this) {
        cell = cell.parentSlot
      }
      return cell
    }

    onGetRanges(ev => {
      const start = getSelfSlot(selection.startSlot!)
      const end = getSelfSlot(selection.endSlot!)

      if (start && end) {
        const rect = this.getMaxRectangle(start, end)
        if (rect) {
          this.tableSelection.set({
            startColumn: rect.x1,
            endColumn: rect.x2,
            startRow: rect.y1,
            endRow: rect.y2
          })
          const selectedSlots = this.getSelectedNormalizedSlotsByRectangle(rect)
          ev.useRanges(selectedSlots.map(item => {
            return item.cells.filter(i => {
              return i.visible
            }).map<SlotRange>(i => {
              return {
                startIndex: 0,
                endIndex: i.raw.slot.length,
                slot: i.raw.slot
              }
            })
          }).flat())
        }
      }
    })
  }

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
    this.state.columnsConfig.splice(index, 0, defaultColumnWidth)
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
      row.cells.splice(index, 0, {
        id: v4(),
        slot
      })
    })
    this.textbus.nextTick(() => {
      const slot = this.state.rows[0].cells[index].slot
      if (slot) {
        this.selection.selectFirstPosition(slot.getContentAtIndex(0) as Component<any>)
      }
    })
  }

  insertRow(index: number) {
    this.state.rows.splice(index, 0, {
      height: defaultRowHeight,
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
        return {
          id: v4(),
          slot
        }
      })
    })
    this.textbus.nextTick(() => {
      const slot = this.state.rows[index].cells[0].slot
      if (slot) {
        this.selection.selectFirstPosition(slot.getContentAtIndex(0) as Component<any>)
      }
    })
  }
}
