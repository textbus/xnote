import { withScopedCSS } from '@viewfly/scoped-css'
import { createSignal, inject, onMounted, Signal, StaticRef } from '@viewfly/core'
import { Slot, Selection, fromEvent } from '@textbus/core'
import { useProduce } from '@viewfly/hooks'

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
  const selectedColumnRange = createSignal<null | { startIndex: number, endIndex: number }>(null)

  let isSelectColumn = false
  let maskActive = false

  function selectColumn(index: number, isMultiple: boolean) {
    editorService.hideInlineToolbar = true
    isSelectColumn = true
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


  const [toolbarStyles, updateToolbarStyles] = useProduce({
    left: 0,
    top: 0,
    visible: false
  })

  let mouseDownFromToolbar = false

  onMounted(() => {
    const sub = fromEvent(document, 'click').subscribe(() => {
      props.onSelectColumn(false)
      if (mouseDownFromToolbar) {
        mouseDownFromToolbar = false
        return
      }
      updateToolbarStyles(draft => {
        draft.visible = false
      })
    })
    return () => sub.unsubscribe()
  })

  const tableService = inject(TableService)

  return withScopedCSS(css, () => {
    const state = props.component.state
    const currentSelectedColumnRange = selectedColumnRange()
    const currentSelectedColumnRangeSorted = currentSelectedColumnRange
      ? [currentSelectedColumnRange.startIndex, currentSelectedColumnRange.endIndex].sort((a, b) => a - b)
      : null
    return (
      <div class="top-bar">
        <div class="xnote-table-toolbar">
          <ComponentToolbar
            style={{
              display: 'inline-block',
              left: toolbarStyles().left + 'px',
              top: toolbarStyles().top + 'px',
            }}
            visible={toolbarStyles().visible}>
            <ToolbarItem>
              <Button><span class="xnote-icon-bin"></span></Button>
            </ToolbarItem>
          </ComponentToolbar>
        </div>
        <div class="toolbar-wrapper">
          <div class="insert-bar">
            <table>
              <tbody>
              <tr>
                {
                  state.layoutWidth.map((i, index) => {
                    return (
                      <td style={{ width: i + 'px', minWidth: i + 'px' }}>
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
                      </td>
                    )
                  })
                }
              </tr>
              </tbody>
            </table>
          </div>
          <div class={['action-bar', { active: props.isFocus() }]}>
            <table>
              <tbody>
              <tr>
                {
                  state.layoutWidth.map((i, index) => {
                    return <td onClick={ev => {
                      mouseDownFromToolbar = true
                      if (!ev.shiftKey) {
                        updateToolbarStyles(draft => {
                          draft.left = (ev.target as HTMLTableCellElement).offsetLeft + i / 2 - props.scrollRef.current!.scrollLeft
                          draft.top = -5
                          draft.visible = true
                        })
                      } else {
                        updateToolbarStyles(draft => {
                          draft.visible = false
                        })
                      }
                    }} onMousedown={ev => {
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
          <div class={[
            'mask',
            {
              active: selectedColumnRange()
            }
          ]} style={isSelectColumn ? {
            width: currentSelectedColumnRangeSorted ? state.layoutWidth.slice(currentSelectedColumnRangeSorted[0], currentSelectedColumnRangeSorted[1] + 1).reduce((a, b) => a + b, 0) + 'px' : '',
            top: 0,
            bottom: 0,
            left: currentSelectedColumnRangeSorted ? state.layoutWidth.slice(0, currentSelectedColumnRangeSorted[0]).reduce((a, b) => a + b, 0) + 'px' : ''
          } : null}/>
        </div>
      </div>
    )
  })
}
