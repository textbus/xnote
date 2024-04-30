import { Component, ComponentStateLiteral, ContentType, Textbus } from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'

import './image.component.scss'

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

  override setup() {
    //
  }
}

export function ImageView(props: ViewComponentProps<ImageComponent>) {
  const { name, state } = props.component
  return () => {
    return (
      <div class="xnote-image" data-component={name}>
        <img alt="" src={state.src} style={{
          width: state.width,
          height: state.height
        }}/>
      </div>
    )
  }
}
