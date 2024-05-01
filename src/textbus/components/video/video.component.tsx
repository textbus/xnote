import { Component, ComponentStateLiteral, ContentType, Slot, Textbus } from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader } from '@textbus/platform-browser'
import { createRef } from '@viewfly/core'

import './video.component.scss'
import { DragResize } from '../../../components/drag-resize/drag-resize'

export interface VideoComponentState {
  src: string
  width?: string
  height?: string
}

export class VideoComponent extends Component<VideoComponentState> {
  static type = ContentType.InlineComponent
  static componentName = 'VideoComponent'

  static fromJSON(textbus: Textbus, json: ComponentStateLiteral<VideoComponentState>) {
    return new VideoComponent(textbus, {
      ...json
    })
  }

  override setup() {
    //
  }
}

export function VideoView(props: ViewComponentProps<VideoComponent>) {
  const { name, state } = props.component
  const videoRef = createRef<HTMLVideoElement>()
  return () => {
    return (
      <div class="xnote-video" data-component={name}>
        <DragResize source={videoRef} component={props.component}>
          <video ref={videoRef} src={state.src} style={{
            width: state.width,
            height: state.height
          }}/>
        </DragResize>
      </div>
    )
  }
}

export const videoComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.tagName === 'IMG' || element.dataset.component === VideoComponent.componentName
  },
  read(element: HTMLElement, textbus: Textbus): Component | Slot | void {
    return new VideoComponent(textbus, {
      src: element instanceof HTMLImageElement ? element.src : element.querySelector('video')?.src || ''
    })
  }
}
