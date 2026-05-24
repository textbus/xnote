import { createSignal, inject, onMounted, onUnmounted, Signal, watch } from '@viewfly/core'
import { fromEvent } from '@textbus/core'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import './top-bar.scss'
import { EditorService } from '../../../../services/editor.service'
import { TableComponent } from '../table.component'
import { ComponentToolbar } from './component-toolbar'
import { TableService } from '../table.service'
import { sum } from '../_utils'

export interface TopBarProps {
  isFocus: Signal<boolean>
  component: TableComponent
  layoutWidth: Signal<number[]>
}

export const TopBar = function TopBar(props: TopBarProps) {
  const editorService = inject(EditorService)
  const tableService = inject(TableService)
  const selectedColumnRange = createSignal<null | { startIndex: number, endIndex: number }>(null)

  function selectColumn(index: number, isMultiple: boolean) {
    editorService.hideInlineToolbar = true
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

    let { startIndex, endIndex } = selectedColumnRange()!

    if (startIndex > endIndex) {
      [startIndex, endIndex] = [endIndex, startIndex]
    }
    props.component.selectColumn(startIndex, endIndex + 1)
  }

  let mouseDownFromToolbar = false

  onMounted(() => {
    const sub = fromEvent(document, 'click').subscribe(() => {
      if (mouseDownFromToolbar) {
        mouseDownFromToolbar = false
        return
      }
      selectedColumnRange.set(null)
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

  // const instance = getCurrentInstance()
  const s = props.component.changeMarker.onChange.subscribe(() => {
    const currentLayout = props.component.state.columnsConfig.slice()
    if (currentLayout.join(',') !== props.layoutWidth().join(',')) {
      props.layoutWidth.set(currentLayout)
    }
    // instance.markAsDirtied()
  })
  onUnmounted(() => {
    s.unsubscribe()
  })

  watch(props.component.tableSelection, (v) => {
    if (!v) {
      selectedColumnRange.set(null)
    }
  })

  return () => {
    const { state, tableSelection } = props.component

    const position = tableSelection()
    const range = selectedColumnRange()
    let left = 0
    if (range) {
      left = sum(props.component.state.columnsConfig.slice(0, Math.min(range.startIndex, range.endIndex)))
      left += sum(props.component.state.columnsConfig.slice(
        Math.min(range.startIndex, range.endIndex),
        Math.max(range.startIndex, range.endIndex) + 1)
      ) / 2
    }
    return (
      <div class={['xnote-table-top-bar', {
        'xnote-table-top-bar--active': props.isFocus()
      }]}>
        <div class="xnote-table-top-toolbar-wrap">
          <div class="xnote-table-top-insert-bar">
            <ComponentToolbar
              style={{
                left: left - leftDistance() + 'px',
                display: selectedColumnRange() ? 'inline-block' : 'none',
              }}
              innerStyle={{
                padding: 0,
                transform: 'translateX(-50%)'
              }}
              visible={!!selectedColumnRange() && !!position}>
              <Button style={{
                padding: '0 8px',
              }} variant={'text'} type={'primary'} size={'small'} onClick={() => {
                props.component.deleteColumns()
              }}><IconGlyph name={'bin'}/></Button>
            </ComponentToolbar>
            <table style={{
              transform: `translateX(${-leftDistance()}px)`
            }}>
              <tbody>
              <tr>
                {
                  props.layoutWidth().map((i, index) => {
                    return (
                      <td style={{ width: i + 'px', minWidth: i + 'px' }}>
                        <div class="xnote-table-insert-tool">
                          {
                            index === 0 && (
                              <span onMouseenter={() => {
                                tableService.onInsertColumnBefore.next(0)
                              }} onMouseleave={() => {
                                tableService.onInsertColumnBefore.next(null)
                              }} class="xnote-table-insert-btn-wrap" style={{
                                left: '-10px'
                              }} onClick={() => {
                                props.component.insertColumn(0)
                              }}>
                              <button class="xnote-table-insert-btn" type="button">+</button>
                            </span>
                            )
                          }
                          <span class="xnote-table-insert-btn-wrap" onMouseenter={() => {
                            tableService.onInsertColumnBefore.next(index + 1)
                          }} onMouseleave={() => {
                            tableService.onInsertColumnBefore.next(null)
                          }} onClick={() => {
                            props.component.insertColumn(index + 1)
                          }}>
                            <button class="xnote-table-insert-btn" type="button">+</button>
                          </span>
                        </div>
                      </td>
                    )
                  })
                }
              </tr>
              </tbody>
            </table>
          </div>
          <div class={['xnote-table-column-action-bar', { 'xnote-table-column-action-bar--active': props.isFocus() }]}>
            <table style={{
              transform: `translateX(${-leftDistance()}px)`
            }}>
              <tbody>
              <tr>
                {
                  props.layoutWidth().map((i, index) => {
                    return <td onMousedown={ev => ev.preventDefault()} onClick={ev => {
                      mouseDownFromToolbar = true
                      selectColumn(index, ev.shiftKey)
                    }} class={{
                      'xnote-table-column-action-bar-cell--active': !position ? false :
                        (position.startRow === 0 &&
                          position.endRow === state.rows.length &&
                          index >= position.startColumn && index < position.endColumn
                        )
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
  }
}
