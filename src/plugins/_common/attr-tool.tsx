import { inject, onUnmounted } from '@viewfly/core'
import { Commander, Query, QueryStateType, Selection } from '@textbus/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { useProduce } from '@viewfly/hooks'

import css from './block-tool.scoped.scss'
import { MenuItem } from '../../components/menu-item/menu-item'
import { Button } from '../../components/button/button'
import { Dropdown } from '../../components/dropdown/dropdown'
import { Divider } from '../../components/divider/divider'
import { RefreshService } from '../../services/refresh.service'
import { textAlignAttr } from '../../textbus/attributes/text-align.attr'
import { textIndentAttr } from '../../textbus/attributes/text-indent.attr'

export function AttrTool() {
  const commander = inject(Commander)
  const selection = inject(Selection)
  const query = inject(Query)
  const refreshService = inject(RefreshService)

  const [checkStates, setCheckStates] = useProduce({
    textAlign: 'left',
    textIndent: 0
  })

  function updateCheckStates() {
    setCheckStates(draft => {
      const textAlignState = query.queryAttribute(textAlignAttr)
      const textIndentState = query.queryAttribute(textIndentAttr)

      draft.textAlign = textAlignState.state === QueryStateType.Enabled ? textAlignState.value! : 'left'
      draft.textIndent = textIndentState.state === QueryStateType.Enabled ? textIndentState.value! : 0
    })
  }

  updateCheckStates()

  const subscription = refreshService.onRefresh.subscribe(() => {
    updateCheckStates()
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  function updateAttr(value: any) {
    switch (value) {
      case 't-l':
        commander.applyAttribute(textAlignAttr, '')
        break
      case 't-r':
        commander.applyAttribute(textAlignAttr, 'right')
        break
      case 't-c':
        commander.applyAttribute(textAlignAttr, 'center')
        break
      case 't-j':
        commander.applyAttribute(textAlignAttr, 'justify')
        break
      case 'i+':
        selection.getBlocks().forEach(block => {
          const oldIndent = block.slot.getAttribute(textIndentAttr)
          let value = 1
          if (oldIndent) {
            value = oldIndent + 1
          }
          block.slot.setAttribute(textIndentAttr, value)
        })
        break
      case 'i-':
        selection.getBlocks().forEach(block => {
          const oldIndent = block.slot.getAttribute(textIndentAttr)
          let value = 0
          if (oldIndent) {
            value = oldIndent - 1
          }
          block.slot.setAttribute(textIndentAttr, value)
        })
        break
    }
  }

  return withScopedCSS(css, () => {
    const states = checkStates()
    return (
      <Dropdown onCheck={updateAttr} trigger={'hover'} menu={[
        {
          label: <MenuItem checked={states.textAlign === 'left'}><span class="xnote-icon-paragraph-left icon"></span>左对齐</MenuItem>,
          value: 't-l'
        }, {
          label: <MenuItem checked={states.textAlign === 'right'}><span class="xnote-icon-paragraph-right icon"></span>右对齐</MenuItem>,
          value: 't-r'
        }, {
          label: <MenuItem checked={states.textAlign === 'center'}><span
            class="xnote-icon-paragraph-center icon"></span>居中对齐</MenuItem>,
          value: 't-c'
        }, {
          label: <MenuItem checked={states.textAlign === 'justify'}><span
            class="xnote-icon-paragraph-justify icon"></span>分散对齐</MenuItem>,
          value: 't-j'
        }, {
          label: <Divider/>,
          value: ''
        }, {
          label: <MenuItem><span class="xnote-icon-indent-increase icon"></span> 增加缩进</MenuItem>,
          value: 'i+'
        }, {
          label: <MenuItem><span class="xnote-icon-indent-decrease icon"></span> 减少缩进</MenuItem>,
          value: 'i-'
        }
      ]}>
        <Button arrow={true} highlight={false}>
          <span class={`xnote-icon-paragraph-${states.textAlign || 'left'} icon`}/>
        </Button>
      </Dropdown>
    )
  })
}
