import { createRef, inject, onMounted, onUpdated, Props, reactive, Signal, withMark } from '@viewfly/core'
import { fromEvent } from '@textbus/core'
import { Input } from '@textbus/platform-browser'

import css from './scroll.scoped.scss'
import { TableService } from '../table.service'

export interface ScrollProps extends Props {
  isFocus: Signal<boolean>
}

export const Scroll = withMark(css, function Scroll(props: ScrollProps) {
  const scrollRef = createRef<HTMLDivElement>()
  const input = inject(Input)
  const tableService = inject(TableService)

  const showShadow = reactive({
    leftEnd: false,
    rightEnd: false
  })
  onMounted(() => {
    const el = scrollRef.value!

    function update() {
      if (props.isFocus()) {
        input.caret.refresh()
      }
      showShadow.leftEnd = el.scrollLeft === 0
      showShadow.rightEnd = el.scrollLeft === el.scrollWidth - el.offsetWidth
    }

    update()
    const s = fromEvent(el, 'scroll').subscribe(update)
    return () => s.unsubscribe()
  })

  onUpdated(() => {
    const el = scrollRef.value!
    showShadow.leftEnd = el.scrollLeft === 0
    showShadow.rightEnd = el.scrollLeft === el.scrollWidth - el.offsetWidth
  })

  return () => {
    return <div ref={[scrollRef]} class={['scroll-container', {
      'left-end': showShadow.leftEnd,
      'right-end': showShadow.rightEnd,
      'active': props.isFocus(),
      // 'hide-selection': isSelectColumn()
    }]} onScroll={ev => {
      setTimeout(() => {
        tableService.onScroll.next((ev.target as HTMLDivElement).scrollLeft)
      }, 30)
    }}>{props.children}</div>
  }
})
