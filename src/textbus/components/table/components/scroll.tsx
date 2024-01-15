import { createRef, inject, onMounted, Props, Signal, StaticRef } from '@viewfly/core'
import { fromEvent } from '@textbus/core'
import { useProduce } from '@viewfly/hooks'
import { Input } from '@textbus/platform-browser'
import { withScopedCSS } from '@viewfly/scoped-css'

import css from './scroll.scoped.scss'

export interface ScrollProps extends Props {
  onScroll(scrollLeft: number): void
  isFocus: Signal<boolean>
  scrollRef: StaticRef<HTMLDivElement>
}

export function Scroll(props: ScrollProps) {
  const scrollRef = createRef<HTMLDivElement>()
  const input = inject(Input)

  const [showShadow, updateShowShadow] = useProduce({
    leftEnd: false,
    rightEnd: false
  })
  onMounted(() => {
    const el = scrollRef.current!

    function update() {
      if (props.isFocus()) {
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

  return withScopedCSS(css, () => {
    return <div ref={[scrollRef, props.scrollRef]} class={['scroll-container', {
      'left-end': showShadow().leftEnd,
      'right-end': showShadow().rightEnd,
      'active': props.isFocus(),
      // 'hide-selection': isSelectColumn()
    }]} onScroll={ev => {
      props.onScroll((ev.target as HTMLDivElement).scrollLeft)
    }}>{props.children}</div>
  })
}