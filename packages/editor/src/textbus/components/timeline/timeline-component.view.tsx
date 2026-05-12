import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { inject } from '@viewfly/core'
import { ContentType, createVNode, Slot, Textbus } from '@textbus/core'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { IconGlyph } from '@viewfly/ui-icons'
import { Button } from '@viewfly/ui-components'

import { I18nService } from '../../../services/i18n.service'
import { createTimelineItem, TimelineComponent } from './timeline.component'
import { useOutput } from '../../hooks/use-output'
import { useReadonly } from '../../hooks/use-readonly'
import './timeline.component.scss'

export function TimelineComponentView(props: ViewComponentProps<TimelineComponent>) {
  const i18n = inject(I18nService)
  const adapter = inject(DomAdapter)
  const isOutput = useOutput()
  const isReadonly = useReadonly()

  return () => {
    const component = props.component
    return (
      <div class="xnote-timeline" ref={props.rootRef} data-component={TimelineComponent.componentName}>
        {
          component.state.items.map(item => {
            return (
              <div class="xnote-timeline-item" key={item.slot.id}>
                <div class="xnote-timeline-line" style={{
                  borderColor: item.theme,
                }}/>
                <div class="xnote-timeline-icon" style={{
                  borderColor: item.theme,
                  backgroundColor: item.theme,
                }}/>
                {
                  !isOutput() && !isReadonly() && <div class="xnote-timeline-tools">
                    <Button size={'small'} shape={'circle'} class="xnote-step-add" onClick={() => {
                      const index = component.state.items.indexOf(item) + 1
                      component.state.items.splice(index, 0, createTimelineItem(item.theme, i18n))
                    }}>
                      <IconGlyph name={'plus'}/>
                    </Button>
                    {' '}
                    <Button size={'small'} shape={'circle'} class="xnote-step-add" onClick={() => {
                      const index = component.state.items.indexOf(item)
                      component.state.items.splice(index, 1)
                    }}>
                      <IconGlyph name={'bin'}/>
                    </Button>
                  </div>
                }
                {
                  adapter.slotRender(item.slot, children => {
                    return createVNode('div', {
                      class: 'xnote-timeline-item-content',
                    }, children)
                  }, isOutput() || isReadonly())
                }
              </div>
            )
          })
        }
      </div>
    )
  }
}


export const timelineComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.className === 'xnote-timeline'
  },
  read(element: HTMLElement, _: Textbus, slotParser: SlotParser) {
    return new TimelineComponent({
      items: Array.from(element.children).map(child => {
        const slot = new Slot([
          ContentType.BlockComponent
        ])
        return {
          theme: '',
          slot: slotParser(slot, child.querySelector('div.xnote-timeline-content') || document.createElement('div'))
        }
      })
    })
  }
}

