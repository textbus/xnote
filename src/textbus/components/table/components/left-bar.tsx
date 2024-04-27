import { withScopedCSS } from '@viewfly/scoped-css'
import { createRef, getCurrentInstance, inject, onUnmounted, onUpdated, Signal, StaticRef } from '@viewfly/core'
import { useProduce } from '@viewfly/hooks'

import css from './left-bar.scoped.scss'
import { TableComponent } from '../table.component'
import { TableService } from '../table.service'

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

  const [toolbarStyles, updateToolbarStyles] = useProduce({
    left: 0,
    top: 0,
    visible: false
  })

  console.log(toolbarStyles)
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
  return withScopedCSS(css, () => {
    const state = props.component.state
    return (
      <div class={['left-bar', { active: props.isFocus() }]}>
        <div class="insert-bar">
          <table ref={insertBarRef}>
            <tbody>
            {
              state.rows.map((i, index) => {
                return (
                  <tr style={{ height: i.height + 'px', minHeight: i.height + 'px' }}>
                    <td>
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
              props.component.state.rows.map(i => {
                return <tr style={{ height: i.height + 'px' }}>
                  <td onClick={ev => {
                    // mouseDownFromToolbar = true
                    if (!ev.shiftKey) {
                      updateToolbarStyles(draft => {
                        draft.top = (ev.target as HTMLTableCellElement).offsetTop + (ev.target as HTMLTableCellElement).offsetHeight / 2 + 18
                        draft.left = -100
                        draft.visible = true
                      })
                    } else {
                      updateToolbarStyles(draft => {
                        draft.visible = false
                      })
                    }
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
