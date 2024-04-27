import { withScopedCSS } from '@viewfly/scoped-css'
import { createSignal, inject, onMounted, Signal, StaticRef, watch } from '@viewfly/core'
import { Slot, Selection, fromEvent } from '@textbus/core'

import css from './top-bar.scoped.scss'
import { EditorService } from '../../../../services/editor.service'
import { Row, TableComponent } from '../table.component'
import { ComponentToolbar } from '../../../../components/component-toolbar/component-toolbar'
import { ToolbarItem } from '../../../../components/toolbar-item/toolbar-item'
import { Button } from '../../../../components/button/button'
import { TableService } from '../table.service'

export interface TopBarProps {
  isFocus: Signal<boolean>
  component: TableComponent
  scrollRef: StaticRef<HTMLDivElement>

  onSelectColumn(isSelected: boolean): void

  rows: Row[]
}

export function TopBar(props: TopBarProps) {
  const editorService = inject(EditorService)
  const selection = inject(Selection)
  const tableService = inject(TableService)
  const selectedColumnRange = createSignal<null | {startIndex: number, endIndex: number}>(null)

  watch(selectedColumnRange, value => {
    const currentSelectedColumnRangeSorted = value
      ? [value.startIndex, value.endIndex].sort((a, b) => a - b)
      : null
    if (currentSelectedColumnRangeSorted) {
      tableService.onSelectColumns.next({
        start: currentSelectedColumnRangeSorted[0],
        end: currentSelectedColumnRangeSorted[1]
      })
    } else {
      tableService.onSelectColumns.next(null)
    }
  })

  let maskActive = false

  function selectColumn(index: number, isMultiple: boolean) {
    editorService.hideInlineToolbar = true
    maskActive = true
    const currentSelectedColumnRange = selectedColumnRange()
    if (isMultiple && currentSelectedColumnRange) {
      selectedColumnRange.set({
        startIndex: currentSelectedColumnRange.startIndex,
        endIndex: index
      })

    } else {
      selectedColumnRange.set({
        startIndex: index, endIndex: index
      })
    }

    const range = selectedColumnRange()!
    const [startIndex, endIndex] = [range.startIndex, range.endIndex].sort((a, b) => a - b)

    const selectedSlots: Slot[] = []
    const rows = props.rows
    rows.forEach(row => {
      selectedSlots.push(...row.cells.slice(startIndex, endIndex + 1).map(i => i.slot))
    })
    selection.setSelectedRanges(selectedSlots.map(i => {
      return {
        slot: i,
        startIndex: 0,
        endIndex: i.length
      }
    }))
    props.onSelectColumn(true)
  }

  onMounted(() => {
    const selectionChangeSubscription = selection.onChange.subscribe(() => {
      if (maskActive) {
        maskActive = false
        return
      }
      selectedColumnRange.set(null)
    })

    return () => {
      selectionChangeSubscription.unsubscribe()
    }
  })


  let mouseDownFromToolbar = false

  onMounted(() => {
    const sub = fromEvent(document, 'click').subscribe(() => {
      if (mouseDownFromToolbar) {
        mouseDownFromToolbar = false
        return
      }
      props.onSelectColumn(false)
      deleteIndex.set(null)
    })
    return () => sub.unsubscribe()
  })

  const leftDistance = createSignal(0)

  onMounted(() => {
    const sub = tableService.onScroll.subscribe(n => {
      leftDistance.set(n)
    })

    return () => sub.unsubscribe()
  })

  const deleteIndex = createSignal<null | number>(null)

  return withScopedCSS(css, () => {
    const state = props.component.state
    const currentSelectedColumnRange = selectedColumnRange()
    const currentSelectedColumnRangeSorted = currentSelectedColumnRange
      ? [currentSelectedColumnRange.startIndex, currentSelectedColumnRange.endIndex].sort((a, b) => a - b)
      : null

    return (
      <div class={['top-bar', {
        active: props.isFocus()
      }]}>
        <div class="toolbar-wrapper">
          <div class="insert-bar">
            <table style={{
              transform: `translateX(${-leftDistance()}px)`
            }}>
              <tbody>
              <tr>
                {
                  state.layoutWidth.map((i, index) => {
                    return (
                      <td style={{ width: i + 'px', minWidth: i + 'px' }}>
                        <div style={{height: '18px'}}>
                          {
                            index === 0 && (
                              <span onMouseenter={() => {
                                tableService.onInsertColumnBefore.next(0)
                              }} onMouseleave={() => {
                                tableService.onInsertColumnBefore.next(null)
                              }} class="insert-btn-wrap" style={{
                                left: '-10px'
                              }} onClick={() => {
                                props.component.insertColumn(0)
                              }}>
                              <button class="insert-btn" type="button">+</button>
                            </span>
                            )
                          }
                          <span class="insert-btn-wrap" onMouseenter={() => {
                            tableService.onInsertColumnBefore.next(index + 1)
                          }} onMouseleave={() => {
                            tableService.onInsertColumnBefore.next(null)
                          }} onClick={() => {
                            props.component.insertColumn(index + 1)
                          }}>
                          <button class="insert-btn" type="button">+</button>
                        </span>
                          <ComponentToolbar
                            style={{
                              display: deleteIndex() === index ? 'inline-block' : 'none',
                              left: '50%',
                            }}
                            innerStyle={{
                              transform: 'translateX(-50%)'
                            }}
                            visible={deleteIndex() === index}>
                            <ToolbarItem>
                              <Button onClick={() => {
                                props.component.deleteColumn(index)
                              }}><span class="xnote-icon-bin"></span></Button>
                            </ToolbarItem>
                          </ComponentToolbar>
                        </div>
                      </td>
                    )
                  })
                }
              </tr>
              </tbody>
            </table>
          </div>
          <div class={['action-bar', { active: props.isFocus() }]}>
            <table style={{
              transform: `translateX(${-leftDistance()}px)`
            }}>
              <tbody>
              <tr>
                {
                  state.layoutWidth.map((i, index) => {
                    return <td onMousedown={ev => {
                      mouseDownFromToolbar = true
                      if (!ev.shiftKey) {
                        deleteIndex.set(index)
                      } else {
                        deleteIndex.set(null)
                      }
                      selectColumn(index, ev.shiftKey)
                    }} class={{
                      active: currentSelectedColumnRangeSorted ? index >= currentSelectedColumnRangeSorted[0] && index <= currentSelectedColumnRangeSorted[1] : null
                    }} style={{ width: i + 'px', minWidth: i + 'px' }}/>
                  })
                }
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  })
}
