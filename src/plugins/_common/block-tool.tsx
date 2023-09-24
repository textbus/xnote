import { inject, onUnmounted } from '@viewfly/core'
import { Commander, ContentType, Query, QueryStateType, Selection, Slot, Textbus } from '@textbus/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { useProduce } from '@viewfly/hooks'

import css from './block-tool.scoped.scss'
import { MenuItem } from '../../components/menu-item/menu-item'
import { Button } from '../../components/button/button'
import { Dropdown } from '../../components/dropdown/dropdown'
import { headingAttr } from '../../textbus/attributes/heading.attr'
import { paragraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { todolistComponent } from '../../textbus/components/todolist/todolist.component'
import { Divider } from '../../components/divider/divider'
import { blockquoteComponent } from '../../textbus/components/blockqoute/blockquote.component'
import { RefreshService } from '../../services/refresh.service'
import { sourceCodeComponent, SourceCodeComponentState } from '../../textbus/components/source-code/source-code.component'

export function BlockTool() {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const query = inject(Query)
  const textbus = inject(Textbus)
  const refreshService = inject(RefreshService)

  const [checkStates, setCheckStates] = useProduce({
    paragraph: false,
    h1: false,
    h2: false,
    h3: false,
    h4: false,
    h5: false,
    h6: false,
    todolist: false,
    blockquote: false
  })

  function updateCheckStates() {
    setCheckStates(draft => {
      const heading = query.queryAttribute(headingAttr)
      draft.paragraph = query.queryComponent(paragraphComponent).state === QueryStateType.Enabled
      draft.h1 = draft.h2 = draft.h3 = draft.h4 = draft.h5 = draft.h6 = false
      if (heading.state === QueryStateType.Enabled) {
        draft[heading.value as any] = true
        draft.paragraph = false
      }
      draft.todolist = query.queryComponent(todolistComponent).state === QueryStateType.Enabled
      draft.blockquote = query.queryComponent(blockquoteComponent).state === QueryStateType.Enabled
    })
  }

  updateCheckStates()

  const subscription = refreshService.onRefresh.subscribe(() => {
    updateCheckStates()
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

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
      case 'blockquote': {
        const state = query.queryComponent(blockquoteComponent)
        if (state.state === QueryStateType.Enabled) {
          const current = state.value!
          const parent = current.parent!

          const index = parent.indexOf(current)

          parent.retain(index)

          commander.removeComponent(current)

          current.slots.get(0)!.sliceContent().forEach(i => {
            parent.insert(i)
          })
        } else {
          const block = blockquoteComponent.createInstance(textbus)
          const slot = block.slots.get(0)!
          if (selection.startSlot === selection.endSlot) {
            const parentComponent = selection.startSlot!.parent!
            const parentSlot = parentComponent.parent!
            const position = parentSlot.indexOf(parentComponent)
            slot.insert(parentComponent)
            parentSlot.retain(position)
            parentSlot.insert(block)
          } else {
            const commonAncestorSlot = selection.commonAncestorSlot!
            const scope = selection.getCommonAncestorSlotScope()!
            commonAncestorSlot.cut(scope.startOffset, scope.endOffset).sliceContent().forEach(i => {
              slot.insert(i)
            })
            commonAncestorSlot.retain(scope.startOffset)
            commonAncestorSlot.insert(block)
          }
        }
      }
        break
      case 'sourceCode': {
        const state = query.queryComponent(sourceCodeComponent)
        if (state.state === QueryStateType.Enabled) {
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
        } else {
          commander.transform({
            target: sourceCodeComponent,
            multipleSlot: true,
            slotFactory() {
              return new Slot([
                ContentType.Text
              ])
            },
            stateFactory(): SourceCodeComponentState {
              return {
                lang: '',
                theme: '',
                lineNumber: true
              }
            }
          })
        }
      }
        break
    }
  }

  return withScopedCSS(css, () => {
    const states = checkStates()
    return (
      <Dropdown onCheck={toBlock} trigger={'hover'} menu={[
        {
          label: <MenuItem icon={<span class="xnote-icon-text-indent"/>} checked={states.paragraph}>正文</MenuItem>,
          value: 'paragraph'
        }, {
          label: <MenuItem icon={<span class="heading-icon">H<sub>1</sub></span>} checked={states.h1}>一级标题</MenuItem>,
          value: 'h1'
        }, {
          label: <MenuItem icon={<span class="heading-icon">H<sub>2</sub></span>} checked={states.h2}>二级标题</MenuItem>,
          value: 'h2'
        }, {
          label: <MenuItem icon={<span class="heading-icon">H<sub>3</sub></span>} checked={states.h3}>三级标题</MenuItem>,
          value: 'h3'
        }, {
          label: <MenuItem icon={<span class="heading-icon">H<sub>4</sub></span>} checked={states.h4}>四级标题</MenuItem>,
          value: 'h4'
        }, {
          label: <MenuItem icon={<span class="heading-icon">H<sub>5</sub></span>} checked={states.h5}>五级标题</MenuItem>,
          value: 'h5'
        }, {
          label: <MenuItem icon={<span class="heading-icon">H<sub>6</sub></span>} checked={states.h6}>六级标题</MenuItem>,
          value: 'h6'
        }, {
          label: <Divider/>,
          value: ''
        }, {
          label: <MenuItem icon={<span class="xnote-icon-checkbox-checked"/>} checked={states.todolist}>待办事项</MenuItem>,
          value: 'todolist'
        }, {
          label: <MenuItem icon={<span class="xnote-icon-list-numbered"></span>}>有序列表</MenuItem>,
          value: 'ol'
        }, {
          label: <MenuItem icon={<span class="xnote-icon-list"/>}> 无序列表</MenuItem>,
          value: 'ul'
        }, {
          label: <MenuItem icon={<span class="xnote-icon-quotes-right"/>} checked={states.blockquote}>引用</MenuItem>,
          value: 'blockquote'
        }, {
          label: <MenuItem icon={<span class="xnote-icon-source-code"/>} checked={states.blockquote}>代码块</MenuItem>,
          value: 'sourceCode'
        }
      ]}>
        <Button arrow={true} highlight={false}>H1</Button>
      </Dropdown>
    )
  })
}
