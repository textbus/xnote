import { inject } from '@viewfly/core'
import { Commander, ContentType, Selection, Slot, Textbus } from '@textbus/core'
import { withScopedCSS } from '@viewfly/scoped-css'

import { ParagraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { Button } from '../../components/button/button'
import { Divider } from '../../components/divider/divider'
import { MenuItem } from '../../components/menu-item/menu-item'
import css from './insert-tool.scoped.scss'
import { headingAttr } from '../../textbus/attributes/heading.attr'
import { ListComponent } from '../../textbus/components/list/list.component'
import { SourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { TableComponent } from '../../textbus/components/table/table.component'
import { TodolistComponent } from '../../textbus/components/todolist/todolist.component'

export function InsertTool(props: { slot: Slot | null }) {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const textbus = inject(Textbus)

  function insert(type: string) {
    const component = props.slot?.parent
    if (!component) {
      return
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
          slot.setAttribute(headingAttr, +type.substring(1))
        }
        const p = new ParagraphComponent(textbus, {
          slot
        })
        commander.insertAfter(p, component)
        selection.setPosition(slot, 0)
      }
        break
      case 'ol':
      case 'ul': {
        const slot = new Slot([
          ContentType.InlineComponent,
          ContentType.Text
        ])
        const list = new ListComponent(textbus, {
          slot,
          reorder: true,
          type: type === 'ol' ? 'OrderedList' : 'UnorderedList'
        })
        commander.insertAfter(list, component)
        selection.setPosition(slot, 0)
      }
        break
      case 'sourceCode': {
        const slot = new Slot([
          ContentType.Text
        ])
        const comp = new SourceCodeComponent(textbus, {
          lang: '',
          lineNumber: true,
          slots: [{
            slot,
            emphasize: false
          }]
        })
        commander.insertAfter(comp, component)
        selection.setPosition(slot, 0)
      }
        break
      case 'table': {
        const table = new TableComponent(textbus)
        commander.insertAfter(table, component)
        selection.setPosition(table.state.rows[0].cells[0].slot, 0)
      }
        break
      case 'todolist': {
        const slot = new Slot([
          ContentType.Text,
          ContentType.InlineComponent
        ])
        const comp = new TodolistComponent(textbus, {
          slot,
          checked: false
        })
        commander.insertAfter(comp, component)
        selection.setPosition(slot, 0)
      }
        break
      case 'image':
        break
      case 'video':
        break
    }
  }

  return withScopedCSS(css, () => {
    return <>
      <div class="btn-group">
        <Button ordinary={true} onClick={() => insert('paragraph')}>
          <span class="xnote-icon-pilcrow"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('h1')}>
          <span class="xnote-icon-heading-h1"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('h2')}>
          <span class="xnote-icon-heading-h2"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('h3')}>
          <span class="xnote-icon-heading-h3"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('h4')}>
          <span class="xnote-icon-heading-h4"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('h5')}>
          <span class="xnote-icon-heading-h5"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('h6')}>
          <span class="xnote-icon-heading-h6"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('ol')}>
          <span class="xnote-icon-list-numbered"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('ul')}>
          <span class="xnote-icon-list"/>
        </Button>
        <Button ordinary={true} onClick={() => insert('sourceCode')}>
          <span class="xnote-icon-source-code"/>
        </Button>
      </div>
      <Divider/>
      <MenuItem onClick={() => insert('table')} icon={<span class="xnote-icon-table"/>}>表格</MenuItem>
      <MenuItem onClick={() => insert('todolist')} icon={<span class="xnote-icon-checkbox-checked"/>}>待办列表</MenuItem>
      <MenuItem onClick={() => insert('image')} icon={<span class="xnote-icon-image"/>}>图片</MenuItem>
      <MenuItem onClick={() => insert('video')} icon={<span class="xnote-icon-video"/>}>视频</MenuItem>
    </>
  })
}
