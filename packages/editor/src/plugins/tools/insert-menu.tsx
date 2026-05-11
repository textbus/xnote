import { inject, withMark } from '@viewfly/core'
import { Commander, Component, ContentType, Selection, Slot, Textbus } from '@textbus/core'

import { ParagraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import css from './insert-menu.scoped.scss'
import { headingAttr } from '../../textbus/attributes/heading.attr'
import { ListComponent } from '../../textbus/components/list/list.component'
import { SourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { TableComponent } from '../../textbus/components/table/table.component'
import { TodolistComponent } from '../../textbus/components/todolist/todolist.component'
import { HighlightBoxComponent } from '../../textbus/components/highlight-box/highlight-box.component'
import { FileUploader } from '../../interfaces'
import { ImageComponent } from '../../textbus/components/image/image.component'
import { VideoComponent } from '../../textbus/components/video/video.component'
import { MenuHeading } from '../../components/menu-heading/menu-heading'
import { KatexComponent } from '../../textbus/components/katex/katex.component'
import { createTimelineItem, TimelineComponent } from '../../textbus/components/timeline/timeline.component'
import { createStepItem, StepComponent } from '../../textbus/components/step/step.component'
import { Button, Divider, MenuItem, MenuList } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'
import { MermaidComponent } from '../../textbus/components/mermaid/mermaid.component'
import { RootComponent } from '../../textbus/components/root/root.component'

export interface InsertToolProps {
  slot: Slot | null
  hideTitle?: boolean
  replace?: boolean
}

export const InsertMenu = withMark(css, function (props: InsertToolProps) {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const textbus = inject(Textbus)
  const fileUploader = inject(FileUploader, null)

  function insert(type: string) {
    const component = props.slot?.parent

    function insertComponent(comp: Component<any>) {
      if (props.replace) {
        if (component) {
          commander.replaceComponent(component!, comp)
        }
      } else if (component && !(component instanceof RootComponent)) {
        commander.insertAfter(comp, component!)
      } else {
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
        const table = new TableComponent()
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
          items: [createStepItem()]
        })
        insertComponent(step)
        selection.selectFirstPosition(step, false, true)
      }
        break
      case 'timeline': {
        const timeline = new TimelineComponent({
          items: [createTimelineItem('#296eff')]
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

  return () => {
    return <div class={'w-46'}>
      {
        props.hideTitle ? null : <MenuHeading>{props.replace ? '替换为' : '在下面添加'}</MenuHeading>
      }
      <div class="flex flex-wrap gap-1">
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('paragraph')}>
          <IconGlyph name={'pilcrow'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('h1')}>
          <IconGlyph name={'heading-h1'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('h2')}>
          <IconGlyph name={'heading-h2'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('h3')}>
          <IconGlyph name={'heading-h3'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('h4')}>
          <IconGlyph name={'heading-h4'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('h5')}>
          <IconGlyph name={'heading-h5'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('h6')}>
          <IconGlyph name={'heading-h6'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('ol')}>
          <IconGlyph name={'list-numbered'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('ul')}>
          <IconGlyph name={'list'}/>
        </Button>
        <Button variant={'text'} inlineCompact={true} onClick={() => insert('sourceCode')}>
          <IconGlyph name={'source-code'}/>
        </Button>
      </div>
      <Divider spacing={'compact'}/>
      <MenuList columnCompact={true}>
        <MenuItem density={'compact'} onClick={() => insert('table')} icon={<IconGlyph name={'table'}/>}>表格</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('todolist')}
                  icon={<IconGlyph name={'checkbox-checked'}/>}>待办列表</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('image')} icon={<IconGlyph name={'image'}/>}>图片</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('video')} icon={<IconGlyph name={'video'}/>}>视频</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('highlightBox')}
                  icon={<IconGlyph name={'hightlight-box'}/>}>高亮块</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('katex')}
                  icon={<IconGlyph name={'function'}/>}>数学公式</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('mermaid')} icon={<IconGlyph name={'flow-chart'}/>}>Mermaid
          图表</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('step')} icon={<IconGlyph name={'step'}/>}>步骤条</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('timeline')}
                  icon={<IconGlyph name={'timeline'}/>}>时间轴</MenuItem>
      </MenuList>
    </div>
  }
})
