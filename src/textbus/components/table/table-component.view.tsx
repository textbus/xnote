import {
  createVNode,
  Slot,
  Textbus
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader, DomAdapter } from '@textbus/platform-browser'
import { inject, onUnmounted, createSignal, createRef, provide } from '@viewfly/core'

import './table.component.scss'
import { TableComponent } from './table.component'
import { ResizeColumn } from './components/resize-column'
import { TopBar } from './components/top-bar'
import { Scroll } from './components/scroll'
import { LeftBar } from './components/left-bar'
import { TableService } from './table.service'
import { ResizeRow } from './components/resize-row'
import { SelectionMask } from './components/selection-mask'

export function TableComponentView(props: ViewComponentProps<TableComponent>) {
  const adapter = inject(DomAdapter)
  const isFocus = createSignal(false)

  provide(TableService)
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
  const isSelectRow = createSignal(false)

  return () => {
    const state = props.component.state
    const rows = state.rows

    Promise.resolve().then(() => {
      props.component.afterContentCheck()
    })
    return (
      <div class="xnote-table" data-component={props.component.name} ref={props.rootRef}>
        <TopBar
          isFocus={isFocus}
          component={props.component}
          scrollRef={scrollRef}
          onSelectColumn={is => isSelectColumn.set(is)}/>
        <LeftBar
          tableRef={tableRef}
          isFocus={isFocus}
          onSelectRow={is => isSelectRow.set(is)}
          component={props.component}/>
        <Scroll scrollRef={scrollRef} isFocus={isFocus}>
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
                    <tr>
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
            <SelectionMask tableRef={tableRef} component={props.component}/>
          </div>
        </Scroll>
        <ResizeRow tableRef={tableRef}/>
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
