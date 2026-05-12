import { createRef, createSignal, inject, onUnmounted, Props, Ref } from '@viewfly/core'
import { VIEW_CONTAINER } from '@textbus/platform-browser'
import { fromEvent, Selection } from '@textbus/core'

import './drag-resize.scss'
import { ImageComponent } from '../../textbus/components/image/image.component'
import { VideoComponent } from '../../textbus/components/video/video.component'

export interface DragResizeProps extends Props {
  component: ImageComponent | VideoComponent
  source: Ref<HTMLImageElement | HTMLVideoElement | null>
}

export function DragResize(props: DragResizeProps) {
  const isShow = createSignal(false)

  const selection = inject(Selection)
  const docContainer = inject(VIEW_CONTAINER)
  const component = props.component
  const ref = createRef<HTMLDivElement>()

  const sub = selection.onChange.subscribe(() => {
    const index = component.parent?.indexOf(component)
    if (selection.startSlot !== component.parent ||
      selection.endSlot !== component.parent ||
      selection.startOffset !== index ||
      selection.endOffset !== index + 1) {
      isShow.set(false)
      return
    }
    isShow.set(true)
    const width = ref.value!.offsetWidth
    const height = ref.value!.offsetHeight
    sizeText.set(`${Math.round(width)}px * ${Math.round(height)}px`)
  })

  function selectComponent() {
    selection.selectComponent(component, true)
  }

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const btnGroup = createRef<HTMLDivElement>()
  const mask = createRef<HTMLDivElement>()

  function drag(ev: MouseEvent) {
    ev.preventDefault()
    docContainer.style.pointerEvents = 'none'
    const ele = props.source.value!

    const startRect = ele.getBoundingClientRect()

    const startX = ev.clientX
    const startY = ev.clientY

    const startWidth = startRect.width
    const startHeight = startRect.height
    const startHypotenuse = Math.sqrt(startWidth * startWidth + startHeight * startHeight)

    let endWidth = startWidth
    let endHeight = startHeight
    const handlers = Array.from(btnGroup.value!.children)
    const index = handlers.indexOf(ev.target as HTMLButtonElement)

    const unMove = fromEvent<MouseEvent>(document, 'mousemove').subscribe(ev => {
      ev.preventDefault()
      const moveX = ev.clientX
      const moveY = ev.clientY

      const offsetX = moveX - startX
      const offsetY = moveY - startY

      let gainHypotenuse: number
      let proportion: number
      let sideX: number
      let sideY: number

      switch (index) {
        case 0:
        case 4:
          sideX = startWidth + offsetX
          sideY = startHeight + offsetY
          gainHypotenuse = Math.sqrt(sideX * sideX + sideY * sideY)
          proportion = gainHypotenuse / startHypotenuse
          if (index === 0) {
            proportion = 1 - (proportion - 1)
          }
          endWidth = startWidth * proportion
          endHeight = startHeight * proportion
          break
        case 2:
          sideX = startWidth + offsetX
          sideY = startHeight - offsetY
          gainHypotenuse = Math.sqrt(sideX * sideX + sideY * sideY)
          proportion = gainHypotenuse / startHypotenuse
          endWidth = startWidth * proportion
          endHeight = startHeight * proportion
          break
        case 6:
          sideX = startWidth - offsetX
          sideY = startHeight + offsetY
          gainHypotenuse = Math.sqrt(sideX * sideX + sideY * sideY)
          gainHypotenuse = Math.sqrt(sideX * sideX + sideY * sideY)
          proportion = gainHypotenuse / startHypotenuse
          endWidth = startWidth * proportion
          endHeight = startHeight * proportion
          break
        case 1:
          endHeight = startHeight - offsetY
          break
        case 5:
          endHeight = startHeight + offsetY
          break
        case 3:
          endWidth = startWidth + offsetX
          break
        case 7:
          endWidth = startWidth - offsetX
          break
      }
      ele.style.width = endWidth + 'px'
      ele.style.height = endHeight + 'px'

      sizeText.set(`${Math.round(endWidth)}px * ${Math.round(endHeight)}px`)
    })

    const unUp = fromEvent(document, 'mouseup').subscribe(() => {
      component.state.width = endWidth + 'px'
      component.state.height = endHeight + 'px'
      docContainer.style.pointerEvents = ''
      unMove.unsubscribe()
      unUp.unsubscribe()
    })
  }

  const sizeText = createSignal(`${component.state.width}*${component.state.height}`)

  return () => {
    return (
      <div class="xnote-drag-resize" onClick={selectComponent}>
        <div class="xnote-drag-resize-media-wrap" ref={ref}>
          {props.children}
        </div>
        <div class={['xnote-drag-resize-overlay', {
          'xnote-drag-resize-overlay--active': isShow()
        }]}>
          <div class="xnote-drag-resize-label" ref={mask}>{sizeText()}</div>
          <div class="xnote-drag-resize-handles" ref={btnGroup} onMousedown={drag}>
            <button type="button"></button>
            <button type="button"></button>
            <button type="button"></button>
            <button type="button"></button>
            <button type="button"></button>
            <button type="button"></button>
            <button type="button"></button>
            <button type="button"></button>
          </div>
        </div>
      </div>
    )
  }
}
