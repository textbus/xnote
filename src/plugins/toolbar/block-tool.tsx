import { inject } from '@viewfly/core'
import { Commander, ContentType, Slot } from '@textbus/core'
import { withScopedCSS } from '@viewfly/scoped-css'

import css from './block-tool.scoped.scss'
import { MenuItem } from '../../components/menu-item/menu-item'
import { Button } from '../../components/button/button'
import { Dropdown } from '../../components/dropdown/dropdown'
import { headingAttr } from '../../textbus/attributes/heading.attr'
import { paragraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { todolistComponent } from '../../textbus/components/todolist/todolist.component'

export function BlockTool() {
  const commander = inject(Commander)

  function toBlock(value: any) {
    switch (value) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        commander.applyAttribute(headingAttr, value)
        break
      case 'paragraph':
        commander.unApplyAttribute(headingAttr)
        commander.transform({
          target: paragraphComponent,
          multipleSlot: false,
          slotFactory() {
            return new Slot([
              ContentType.InlineComponent,
              ContentType.Text
            ])
          }
        })
        break
      case 'todolist':
        commander.unApplyAttribute(headingAttr)
        commander.transform({
          target: todolistComponent,
          multipleSlot: false,
          slotFactory() {
            return new Slot([
              ContentType.InlineComponent,
              ContentType.Text
            ])
          },
          stateFactory() {
            return {
              checked: false
            }
          }
        })
        break
    }
  }

  return withScopedCSS(css, () => {
    return (
      <Dropdown onCheck={toBlock} trigger={'hover'} menu={[
        {
          label: <MenuItem>正文</MenuItem>,
          value: 'paragraph'
        }, {
          label: <MenuItem>标题 1</MenuItem>,
          value: 'h1'
        }, {
          label: <MenuItem>标题 2</MenuItem>,
          value: 'h2'
        }, {
          label: <MenuItem>标题 3</MenuItem>,
          value: 'h3'
        }, {
          label: <MenuItem>标题 4</MenuItem>,
          value: 'h4'
        }, {
          label: <MenuItem>标题 5</MenuItem>,
          value: 'h5'
        }, {
          label: <MenuItem>标题 6</MenuItem>,
          value: 'h6'
        }, {
          label: <MenuItem><span class="xnote-icon-checkbox-checked icon"></span> 待办事项</MenuItem>,
          value: 'todolist'
        }, {
          label: <MenuItem><span class="xnote-icon-list-numbered icon"></span> 有序列表</MenuItem>,
          value: 'ol'
        }, {
          label: <MenuItem><span class="xnote-icon-list icon"></span> 无序列表</MenuItem>,
          value: 'ul'
        }
      ]}>
        <Button arrow={true} highlight={false}>H1</Button>
      </Dropdown>
    )
  })
}
