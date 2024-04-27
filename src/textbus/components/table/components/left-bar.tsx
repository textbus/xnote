import { withScopedCSS } from '@viewfly/scoped-css'
import {
  createRef,
  createSignal,
  getCurrentInstance,
  inject, onMounted,
  onUnmounted,
  onUpdated,
  Signal,
  StaticRef
} from '@viewfly/core'
import { fromEvent } from '@textbus/core'

import css from './left-bar.scoped.scss'
import { TableComponent } from '../table.component'
import { TableService } from '../table.service'
import { ToolbarItem } from '../../../../components/toolbar-item/toolbar-item'
import { Button } from '../../../../components/button/button'
import { ComponentToolbar } from '../../../../components/component-toolbar/component-toolbar'

export interface TopBarProps {
  tableRef: StaticRef<HTMLTableElement>
  isFocus: Signal<boolean>
  component: TableComponent
}

export function LeftBar(props: TopBarProps) {
  // let mouseDownFromToolbar = false
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
    const sub = fromEvent(document, 'mousedown').subscribe(() => {
      if (mouseDownFromToolbar) {
        mouseDownFromToolbar = false
        return
      }
      // props.onSelectColumn(false)
      deleteIndex.set(null)
    })
    return () => sub.unsubscribe()
  })

  const deleteIndex = createSignal<null | number>(null)

  return withScopedCSS(css, () => {
    const state = props.component.state
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
                  <td onMousedown={() => {
                    mouseDownFromToolbar = true
                    deleteIndex.set(index)
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
