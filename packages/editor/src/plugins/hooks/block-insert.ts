import { Commander, Component, ContentType, Slot, Selection, Textbus } from '@textbus/core'
import { inject, Signal } from '@viewfly/core'
import { v4 } from 'uuid'

import {
  createTimelineItem,
  HighlightBoxComponent,
  ImageComponent, KatexComponent,
  ListComponent, MermaidComponent,
  ParagraphComponent,
  RootComponent,
  SourceCodeComponent,
  TableComponent,
  TableComponentState, TimelineComponent, TodolistComponent, VideoComponent
} from '../../textbus/components/_api'
import { headingAttr } from '../../textbus/attributes/heading.attr'
import { FileUploader } from '../../interfaces'
import { I18nService } from '../../services/i18n.service'
import { createStepItem, StepComponent } from '../../textbus/components/step/step.component'
import { TableParams } from '../tools/table/create-table'

export function useBlockInsert(tableParams?: Signal<TableParams>) {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const textbus = inject(Textbus)
  const fileUploader = inject(FileUploader, null)
  const i18n = inject(I18nService)
  return function insert(type: string, replace?: boolean, component?: Component<any> | null) {

    function insertComponent(comp: Component<any>) {
      if (component && !(component instanceof RootComponent)) {
        if (replace) {
          commander.replaceComponent(component!, comp)
        } else {
          commander.insertAfter(comp, component!)
        }
      } else {
        if (!selection.isSelected && component) {
          selection.selectFirstPosition(component)
        }
        commander.insert(comp)
      }
    }

    switch (type) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
      case 'paragraph': {
        const slot = new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
        if (/h[1-6]/.test(type)) {
          slot.setAttribute(headingAttr, type)
        }
        const p = new ParagraphComponent({
          slot
        })
        insertComponent(p)
        selection.setPosition(slot, 0)
      }
        break
      case 'ol':
      case 'ul': {
        const slot = new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
        const list = new ListComponent({
          slot,
          reorder: true,
          type: type === 'ol' ? 'OrderedList' : 'UnorderedList'
        })
        insertComponent(list)
        selection.setPosition(slot, 0)
      }
        break
      case 'sourceCode': {
        const slot = new Slot([
          ContentType.Text
        ])
        const comp = new SourceCodeComponent({
          lang: '',
          lineNumber: true,
          slots: [{
            slot,
            emphasize: false
          }]
        })
        insertComponent(comp)
        selection.setPosition(slot, 0)
      }
        break
      case 'table': {
        if (!tableParams) {
          return
        }
        const params = tableParams()
        if (params.row === 0 || params.row === 0) {
          return
        }
        const data: TableComponentState = {
          columnsConfig: Array.from<number>({ length: params.column }).fill(100),
          rows: Array.from({ length: params.row }).map(() => {
            return {
              height: TableComponent.defaultRowHeight,
              cells: Array.from({ length: params.column }).map(() => {
                const slot = new Slot([
                  ContentType.BlockComponent
                ])
                slot.insert(new ParagraphComponent())
                return {
                  id: v4(),
                  slot
                }
              })
            }
          }),
          mergeConfig: {}
        }
        const table = new TableComponent(data)
        insertComponent(table)
        textbus.nextTick(() => {
          selection.selectFirstPosition(table, true, true)
        })
      }
        break
      case 'todolist': {
        const slot = new Slot([
          ContentType.Text,
          ContentType.InlineComponent
        ])
        const comp = new TodolistComponent({
          slot,
          checked: false
        })
        insertComponent(comp)
        selection.setPosition(slot, 0)
      }
        break
      case 'image':
        if (fileUploader) {
          Promise.resolve().then(() => fileUploader.uploadFile('image')).then(url => {
            const img = new ImageComponent({
              src: url
            })
            commander.insert(img)
          })
        }
        break
      case 'video':
        if (fileUploader) {
          Promise.resolve().then(() => fileUploader.uploadFile('video')).then(url => {
            const img = new VideoComponent({
              src: url
            })
            commander.insert(img)
          })
        }
        break
      case 'highlightBox': {
        const p = new ParagraphComponent()
        const comp = new HighlightBoxComponent()
        comp.state.slot.insert(p)
        insertComponent(comp)
        selection.setPosition(p.state.slot, 0)
      }
        break
      case 'katex': {
        const p = new ParagraphComponent()
        const comp = new KatexComponent()
        p.state.slot.insert(comp)
        insertComponent(p)
        selection.selectComponent(comp)
      }
        break
      case 'step': {
        const step = new StepComponent({
          step: 0,
          items: [createStepItem(i18n)]
        })
        insertComponent(step)
        selection.selectFirstPosition(step, false, true)
      }
        break
      case 'timeline': {
        const timeline = new TimelineComponent({
          items: [createTimelineItem('#296eff', i18n)]
        })
        insertComponent(timeline)
        selection.selectFirstPosition(timeline, false, true)
        break
      }
      case 'mermaid': {
        const comp = new MermaidComponent({
          text: ''
        })
        insertComponent(comp)
        selection.selectComponent(comp)
      }
    }
  }
}
