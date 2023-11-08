import {
  ComponentInstance,
  createVNode, fromEvent,
  Slot,
  Textbus
} from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader, DomAdapter, Input } from '@textbus/platform-browser'
import { inject, onMounted, onUnmounted, onUpdated, useSignal } from '@viewfly/core'
import { useProduce, useStaticRef } from '@viewfly/hooks'

import './table.component.scss'
import { ComponentToolbar } from '../../../components/component-toolbar/component-toolbar'
import { ToolbarItem } from '../../../components/toolbar-item/toolbar-item'
import { TableCellConfig, tableComponent } from './table.component'


export function TableComponentView(props: ViewComponentProps<typeof tableComponent>) {
  const adapter = inject(DomAdapter)
  const isFocus = useSignal(false)
  const subscription = props.component.extends.focus.subscribe(b => {
    isFocus.set(b)
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const tableRef = useStaticRef<HTMLTableElement>()
  const vBarRef = useStaticRef<HTMLTableElement>()
  const scrollRef = useStaticRef<HTMLDivElement>()

  onMounted(() => {
    const subscription = fromEvent<MouseEvent>(tableRef.current!, 'mousemove').subscribe(ev => {
      ev
    })

    return () => {
      subscription.unsubscribe()
    }
  })

  onUpdated(() => {
    const vBarRows = vBarRef.current!.rows
    Array.from(tableRef.current!.rows).forEach((tr, i) => {
      return vBarRows.item(i)!.style.height = tr.getBoundingClientRect().height + 'px'
    })
  })


  const [showShadow, updateShowShadow] = useProduce({
    leftEnd: false,
    rightEnd: false
  })

  const input = inject(Input)

  onMounted(() => {
    const el = scrollRef.current!

    function update() {
      if (isFocus()) {
        input.caret.refresh(false)
      }
      updateShowShadow(draft => {
        draft.leftEnd = el.scrollLeft === 0
        draft.rightEnd = el.scrollLeft === el.scrollWidth - el.offsetWidth
      })
    }

    update()
    const s = fromEvent(el, 'scroll').subscribe(update)
    return () => s.unsubscribe()
  })

  return () => {
    const { slots, state } = props.component
    const rows: Slot<TableCellConfig>[][] = []

    for (let i = 0; i < state.rowCount; i++) {
      rows.push(slots.slice(i * state.colCount, (i + 1) * state.colCount))
    }
    console.log(showShadow().leftEnd, showShadow().rightEnd)
    return (
      <div class="xnote-table" data-component={props.component.name} ref={props.rootRef}>
        <div class="xnote-table-toolbar">
          <ComponentToolbar visible={isFocus()}>
            <ToolbarItem>
              fda
            </ToolbarItem>
          </ComponentToolbar>
        </div>
        <div class="xnote-table-wrapper">
          <div class={['xnote-table-bar-v', { active: isFocus() }]}>
            <div class="xnote-table-selector"/>
            <table ref={vBarRef} class="xnote-table-bar">
              <tbody>
              {
                state.layoutHeight.map(i => {
                  return <tr style={{ height: i + 'px' }}>
                    <td/>
                  </tr>
                })
              }
              </tbody>
            </table>
          </div>
          <div ref={scrollRef} class={[
            'xnote-table-wrapper-h',
            {
              'left-end': showShadow().leftEnd,
              'right-end': showShadow().rightEnd,
              'active': isFocus()
            }
          ]}>
            <div class={['xnote-table-bar-h', { active: isFocus() }]}>
              <table class="xnote-table-bar">
                <tbody>
                <tr>
                  {
                    state.layoutWidth.map(i => {
                      return <td style={{ width: i + 'px', minWidth: i + 'px' }}></td>
                    })
                  }
                </tr>
                </tbody>
              </table>
            </div>
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
          </div>
        </div>
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
