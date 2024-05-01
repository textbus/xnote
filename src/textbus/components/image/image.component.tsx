import { Component, ComponentStateLiteral, ContentType, Slot, Textbus } from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader } from '@textbus/platform-browser'
import { createRef } from '@viewfly/core'

import './image.component.scss'
import { DragResize } from '../../../components/drag-resize/drag-resize'

export interface ImageComponentState {
  src: string
  width?: string
  height?: string
}

export class ImageComponent extends Component<ImageComponentState> {
  static type = ContentType.InlineComponent
  static componentName = 'ImageComponent'

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<ImageComponentState>) {
    return new ImageComponent(textbus, {
      ...json
    })
  }
}

export function ImageView(props: ViewComponentProps<ImageComponent>) {
  const { name, state } = props.component
  const imageRef = createRef<HTMLImageElement>()
  return () => {
    return (
      <div class="xnote-image" ref={props.rootRef} data-component={name}>
        <DragResize source={imageRef} component={props.component}>
          <img alt="" ref={imageRef} src={state.src} style={{
            width: state.width,
            height: state.height
          }}/>
        </DragResize>
      </div>
    )
  }
}

export const imageComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'IMG' || element.dataset.component === ImageComponent.componentName
  },
  read(element: HTMLElement, textbus: Textbus): Component | Slot | void {
    return new ImageComponent(textbus, {
      src: element instanceof HTMLImageElement ? element.src : element.querySelector('img')?.src || ''
    })
  }
}
