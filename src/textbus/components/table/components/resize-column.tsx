import { withScopedCSS } from '@viewfly/scoped-css'
import { createRef, inject, onMounted, StaticRef } from '@viewfly/core'
import { fromEvent } from '@textbus/core'

import css from './resize-column.scoped.scss'
import { TableComponent } from '../table.component'
import { TableService } from '../table.service'

export interface ResizeColumnProps {
  tableRef: StaticRef<HTMLTableElement>
  component: TableComponent
  onActiveStateChange(isActive: boolean): void
}

export function ResizeColumn(props: ResizeColumnProps) {
  const dragLineRef = createRef<HTMLDivElement>()
  let activeCol: number | null = null

  onMounted(() => {
    const { tableRef } = props
    let isDrag = false
    const subscription = fromEvent<MouseEvent>(tableRef.current!, 'mousemove').subscribe(ev => {
      if (isDrag) {
        return
      }
      const tableRect = tableRef.current!.getBoundingClientRect()
      const leftDistance = ev.clientX - tableRect.x
      const state = props.component.state
      let x = 0
      for (let i = 0; i < state.layoutWidth.length; i++) {
        const n = leftDistance - x
        if (i > 0 && Math.abs(n) < 5) {
          Object.assign(dragLineRef.current!.style, {
            left: x + 'px',
            display: 'block'
          })
          activeCol = i
          break
        }
        activeCol = null
        dragLineRef.current!.style.display = 'none'
        x += state.layoutWidth[i]
      }
    }).add(fromEvent<MouseEvent>(dragLineRef.current!, 'mousedown').subscribe(downEvent => {
      isDrag = true
      props.onActiveStateChange(true)

      const x = downEvent.clientX
      const layoutWidth = props.component.state.layoutWidth
      const initWidth = layoutWidth[activeCol! - 1]

      const initLeft = layoutWidth.slice(0, activeCol!).reduce((a, b) => a + b, 0)

      const minWidth = 30
      const minLeft = initLeft - initWidth + minWidth

      const moveEvent = fromEvent<MouseEvent>(document, 'mousemove').subscribe(moveEvent => {
        const distanceX = moveEvent.clientX - x

        dragLineRef.current!.style.left = Math.max(initLeft + distanceX, minLeft) + 'px'
        props.component.state.layoutWidth[activeCol! - 1] = Math.max(initWidth + distanceX, minWidth)
      }).add(fromEvent<MouseEvent>(document, 'mouseup').subscribe(upEvent => {
        isDrag = false
        props.onActiveStateChange(false)
        moveEvent.unsubscribe()
        const distanceX = upEvent.clientX - x
        props.component.state.layoutWidth[activeCol! - 1] = Math.max(initWidth + distanceX, minWidth)
      }))
    }))

    return () => {
      subscription.unsubscribe()
    }
  })

  const tableService = inject(TableService)

  onMounted(() => {
    const sub = tableService.onInsertColumnBefore.subscribe(n => {
      if (n === null) {
        dragLineRef.current!.style.display = 'none'
        return
      }
      const state = props.component.state
      const left = state.layoutWidth.slice(0, n).reduce((a, b) => a + b, 0) - 0.5

      dragLineRef.current!.style.display = 'block'
      dragLineRef.current!.style.left = left + 'px'
    })

    return () => sub.unsubscribe()
  })

  return withScopedCSS(css, () => {
    return <div ref={dragLineRef} class={['drag-line']}/>
  })
}
