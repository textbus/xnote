import {
  ComponentInstance,
  createVNode,
  Slot,
  Textbus
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader, DomAdapter } from '@textbus/platform-browser'
import { inject, onUnmounted, createSignal, createRef, provide } from '@viewfly/core'

import './table.component.scss'
import { TableCellConfig, tableComponent } from './table.component'
import { ResizeColumn } from './components/resize-column'
import { TopBar } from './components/top-bar'
import { Scroll } from './components/scroll'
import { LeftBar } from './components/left-bar'
import { TableService } from './table.service'
import { ResizeRow } from './components/resize-row'


export function TableComponentView(props: ViewComponentProps<typeof tableComponent>) {
  const adapter = inject(DomAdapter)
  const isFocus = createSignal(false)
  
  provide(TableService)
  const subscription = props.component.extends.focus.subscribe(b => {
    isFocus.set(b)
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const tableRef = createRef<HTMLTableElement>()
  const scrollRef = createRef<HTMLDivElement>()
  // 滚动阴影 start
  
  function toRows() {
    const { slots, state } = props.component
    const rows: Slot<TableCellConfig>[][] = []

    for (let i = 0; i < state.rowCount; i++) {
      rows.push(slots.slice(i * state.colCount, (i + 1) * state.colCount))
    }

    return rows
  }

  const isResizeColumn = createSignal(false)
  const isSelectColumn = createSignal(false)
  
  const scrollLeft = createSignal(0)

  return () => {
    const state = props.component.state
    const rows = toRows()

    Promise.resolve().then(() => {
      props.component.extends.afterContentCheck()
    })
    return (
      <div class="xnote-table" data-component={props.component.name} ref={props.rootRef}>
        <TopBar
          isFocus={isFocus}
          component={props.component}
          scrollRef={scrollRef}
          onSelectColumn={is => isSelectColumn.set(is)}
          toRows={toRows}/>
        <LeftBar
          tableRef={tableRef}
          isFocus={isFocus}
          component={props.component}/>
        <Scroll onScroll={leftDistance => {
          scrollLeft.set(leftDistance)
        }} isFocus={isFocus}>
          <div class="xnote-table-container">
            <table ref={tableRef} class="xnote-table-content">
              <colgroup>
                {
                  state.layoutWidth.map(w => {
                    return <col style={{ width: w + 'px', minWidth: w + 'px' }}/>
                  })
                }
              </colgroup>
              <tbody>
              {
                rows.map((row, i) => {
                  return (
                    <tr style={{ height: state.layoutHeight[i] + 'px' }}>
                      {
                        row.map(cell => {
                          return adapter.slotRender(cell, children => {
                            return createVNode('td', null, children)
                          }, false)
                        })
                      }
                    </tr>
                  )
                })
              }
              </tbody>
            </table>
            <ResizeColumn
              tableRef={tableRef}
              component={props.component}
              onActiveStateChange={isActive => {
                isResizeColumn.set(isActive)
              }}/>
          </div>
        </Scroll>
        <ResizeRow tableRef={tableRef}/>
      </div>
    )
  }
}

export const tableComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.component === tableComponent.name
  },
  read(element: HTMLElement, textbus: Textbus): ComponentInstance | Slot | void {
    return tableComponent.createInstance(textbus)
  }
}
