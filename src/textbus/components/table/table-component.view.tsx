import {
  createVNode,
  Slot,
  Textbus
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader, DomAdapter } from '@textbus/platform-browser'
import { inject, onUnmounted, createSignal, createRef } from '@viewfly/core'

import './table.component.scss'
import { TableComponent } from './table.component'
import { ResizeColumn } from './components/resize-column'
import { TopBar } from './components/top-bar'
import { Scroll } from './components/scroll'
import { LeftBar } from './components/left-bar'

export function TableComponentView(props: ViewComponentProps<TableComponent>) {
  const adapter = inject(DomAdapter)
  const isFocus = createSignal(false)
  const subscription = props.component.focus.subscribe(b => {
    isFocus.set(b)
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const tableRef = createRef<HTMLTableElement>()
  const scrollRef = createRef<HTMLDivElement>()
  // 滚动阴影 start


  const isResizeColumn = createSignal(false)
  const isSelectColumn = createSignal(false)

  const scrollLeft = createSignal(0)

  return () => {
    const state = props.component.state
    const rows = state.rows

    Promise.resolve().then(() => {
      props.component.afterContentCheck()
    })
    return (
      <div class="xnote-table" data-component={props.component.name} ref={props.rootRef}>
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
                rows.map((row) => {
                  return (
                    <tr style={{ height: row.height + 'px' }}>
                      {
                        row.cells.map(cell => {
                          return adapter.slotRender(cell.slot, children => {
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
        <TopBar
          isFocus={isFocus}
          component={props.component}
          scrollRef={scrollRef}
          onSelectColumn={is => isSelectColumn.set(is)}
          rows={rows}/>
        <LeftBar tableRef={tableRef} isFocus={isFocus} component={props.component}/>
      </div>
    )
  }
}

export const tableComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.component === TableComponent.componentName
  },
  read(element: HTMLElement, textbus: Textbus): TableComponent | Slot | void {
    return new TableComponent(textbus)
  }
}
