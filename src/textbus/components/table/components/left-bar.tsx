import { withScopedCSS } from '@viewfly/scoped-css'
import { createRef, onUpdated, Signal, StaticRef } from '@viewfly/core'

import css from './left-bar.scoped.scss'
import { TableComponent } from '../table.component'
import { useProduce } from '@viewfly/hooks'

export interface TopBarProps {
  tableRef: StaticRef<HTMLTableElement>
  isFocus: Signal<boolean>
  component: TableComponent
}

export function LeftBar(props: TopBarProps) {
  // let mouseDownFromToolbar = false
  const vBarRef = createRef<HTMLTableElement>()
  const [toolbarStyles, updateToolbarStyles] = useProduce({
    left: 0,
    top: 0,
    visible: false
  })

  console.log(toolbarStyles)
  // 同步行高度
  onUpdated(() => {
    const vBarRows = vBarRef.current!.rows
    setTimeout(() => {
      Array.from(props.tableRef.current!.rows).forEach((tr, i) => {
        return vBarRows.item(i)!.style.height = tr.getBoundingClientRect().height + 'px'
      })
    })
  })
  return withScopedCSS(css, () => {
    return (
      <div class={['left-bar', { active: props.isFocus() }]}>
        <table ref={vBarRef} class="xnote-table-bar">
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
    )
  })
}
