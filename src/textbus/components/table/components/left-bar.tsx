import { withScopedCSS } from '@viewfly/scoped-css'
import {
  createRef,
  createSignal,
  getCurrentInstance,
  inject, onMounted,
  onUnmounted,
  onUpdated,
  Signal,
  StaticRef, watch
} from '@viewfly/core'
import { fromEvent, Slot, Selection } from '@textbus/core'

import css from './left-bar.scoped.scss'
import { TableComponent } from '../table.component'
import { TableService } from '../table.service'
import { ToolbarItem } from '../../../../components/toolbar-item/toolbar-item'
import { Button } from '../../../../components/button/button'
import { ComponentToolbar } from '../../../../components/component-toolbar/component-toolbar'
import { EditorService } from '../../../../services/editor.service'

export interface TopBarProps {
  tableRef: StaticRef<HTMLTableElement>
  isFocus: Signal<boolean>
  component: TableComponent

  onSelectRow(isSelected: boolean): void
}

export function LeftBar(props: TopBarProps) {
  // let mouseDownFromToolbar = false
  const editorService = inject(EditorService)
  const selection = inject(Selection)
  const actionBarRef = createRef<HTMLTableElement>()
  const insertBarRef = createRef<HTMLTableElement>()

  const tableService = inject(TableService)
  // 同步行高度
  onUpdated(() => {
    const insertBarRows = insertBarRef.current!.rows
    const actionBarRows = actionBarRef.current!.rows
    setTimeout(() => {
      Array.from(props.tableRef.current!.rows).forEach((tr, i) => {
        insertBarRows.item(i)!.style.height = tr.getBoundingClientRect().height + 'px'
        actionBarRows.item(i)!.style.height = tr.getBoundingClientRect().height + 'px'
      })
    })
  })
  const instance = getCurrentInstance()
  const s = props.component.changeMarker.onChange.subscribe(() => {
    instance.markAsDirtied()
  })

  onUnmounted(() => {
    s.unsubscribe()
  })

  let mouseDownFromToolbar = false
  onMounted(() => {
    const sub = fromEvent(document, 'click').subscribe(() => {
      if (mouseDownFromToolbar) {
        mouseDownFromToolbar = false
        return
      }
      props.onSelectRow(false)
      deleteIndex.set(null)
    })
    return () => sub.unsubscribe()
  })

  const selectedRowRange = createSignal<null | { startIndex: number, endIndex: number }>(null)

  watch(selectedRowRange, value => {
    const currentSelectedRowRangeSorted = value
      ? [value.startIndex, value.endIndex].sort((a, b) => a - b)
      : null
    if (currentSelectedRowRangeSorted) {
      tableService.onSelectRows.next({
        start: currentSelectedRowRangeSorted[0],
        end: currentSelectedRowRangeSorted[1]
      })
    } else {
      tableService.onSelectRows.next(null)
    }
  })

  const deleteIndex = createSignal<null | number>(null)
  let maskActive = false

  function selectRow(index: number, isMultiple: boolean) {
    editorService.hideInlineToolbar = true
    maskActive = true
    const currentSelectedColumnRange = selectedRowRange()
    if (isMultiple && currentSelectedColumnRange) {
      selectedRowRange.set({
        startIndex: currentSelectedColumnRange.startIndex,
        endIndex: index
      })

    } else {
      selectedRowRange.set({
        startIndex: index, endIndex: index
      })
    }

    const range = selectedRowRange()!
    const [startIndex, endIndex] = [range.startIndex, range.endIndex].sort((a, b) => a - b)

    const selectedSlots: Slot[] = []
    const rows = props.component.state.rows
    rows.slice(startIndex, endIndex + 1).forEach(row => {
      selectedSlots.push(...row.cells.map(i => i.slot))
    })
    selection.setSelectedRanges(selectedSlots.map(i => {
      return {
        slot: i,
        startIndex: 0,
        endIndex: i.length
      }
    }))
    props.onSelectRow(true)
  }

  onMounted(() => {
    const selectionChangeSubscription = selection.onChange.subscribe(() => {
      if (maskActive) {
        maskActive = false
        return
      }
      selectedRowRange.set(null)
    })

    return () => {
      selectionChangeSubscription.unsubscribe()
    }
  })

  return withScopedCSS(css, () => {
    const state = props.component.state
    const currentSelectedRowRange = selectedRowRange()
    const currentSelectedRowRangeSorted = currentSelectedRowRange
      ? [currentSelectedRowRange.startIndex, currentSelectedRowRange.endIndex].sort((a, b) => a - b)
      : null
    return (
      <div class={['left-bar', { active: props.isFocus() }]}>
        <div class="insert-bar">
          <table ref={insertBarRef}>
            <tbody>
            {
              state.rows.map((_, index) => {
                return (
                  <tr>
                    <td>
                      <div class="toolbar-item">
                        {
                          index === 0 && (
                            <span onMouseenter={() => {
                              tableService.onInsertRowBefore.next(-1)
                            }} onMouseleave={() => {
                              tableService.onInsertRowBefore.next(null)
                            }} class="insert-btn-wrap" style={{
                              top: '-14px'
                            }} onClick={() => {
                              props.component.insertRow(0)
                            }}>
                              <button class="insert-btn" type="button">+</button>
                            </span>
                          )
                        }
                        <span onMouseenter={() => {
                          tableService.onInsertRowBefore.next(index)
                        }} onMouseleave={() => {
                          tableService.onInsertRowBefore.next(null)
                        }} class="insert-btn-wrap" onClick={() => {
                          props.component.insertRow(index + 1)
                        }}>
                          <button class="insert-btn" type="button">+</button>
                        </span>
                        <ComponentToolbar
                          style={{
                            display: deleteIndex() === index ? 'inline-block' : 'none',
                            left: '-35px'
                          }}
                          innerStyle={{
                            top: 0,
                            transform: 'translateY(-50%)'
                          }}
                          visible={deleteIndex() === index}>
                          <ToolbarItem>
                            <Button onClick={() => {
                              props.component.deleteRow(index)
                              deleteIndex.set(null)
                            }}><span class="xnote-icon-bin"></span></Button>
                          </ToolbarItem>
                        </ComponentToolbar>
                      </div>
                    </td>
                  </tr>
                )
              })
            }
            </tbody>
          </table>
        </div>
        <div class="action-bar">
          <table ref={actionBarRef}>
            <tbody>
            {
              props.component.state.rows.map((_, index) => {
                return <tr>
                  <td onMousedown={(ev) => {
                    mouseDownFromToolbar = true
                    if (!ev.shiftKey) {
                      deleteIndex.set(index)
                    } else {
                      deleteIndex.set(null)
                    }
                    selectRow(index, ev.shiftKey)
                  }} class={{
                    active: currentSelectedRowRangeSorted ? index >= currentSelectedRowRangeSorted[0] && index <= currentSelectedRowRangeSorted[1] : null
                  }}/>
                </tr>
              })
            }
            </tbody>
          </table>
        </div>
      </div>
    )
  })
}
