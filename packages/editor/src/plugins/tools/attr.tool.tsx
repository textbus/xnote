import { inject, onUnmounted, Props, reactive } from '@viewfly/core'
import { Commander, Query, QueryStateType, Range, Selection, Slot } from '@textbus/core'
import { HTMLAttributes } from '@viewfly/platform-browser'
import { Button, Divider, Dropdown, MenuItem, MenuList } from '@viewfly/ui-components'

import './block-tool.scss'
import { RefreshService } from '../../services/refresh.service'
import { textAlignAttr } from '../../textbus/attributes/text-align.attr'
import { textIndentAttr } from '../../textbus/attributes/text-indent.attr'
import { Keymap } from '../../components/keymap/keymap'
import { useCommonState } from './_common/common-state'
import { IconGlyph } from '@viewfly/ui-icons'
import { I18nService } from '../../services/i18n.service'

export interface AttrToolProps extends Props {
  inLeftTool?: boolean
  style?: HTMLAttributes<HTMLElement>['style']
  slot?: Slot | null

  applyBefore?(): void
}

export function AttrTool(props: AttrToolProps) {
  const i18n = inject(I18nService)
  const commander = inject(Commander)
  const selection = inject(Selection)
  const query = inject(Query)
  const refreshService = inject(RefreshService)

  const checkStates = reactive({
    textAlign: 'left',
    textIndent: 0
  })

  function updateCheckStates() {
    if (!props.slot && !selection.isSelected) {
      return
    }
    const range: Range = props.slot ? {
      startSlot: props.slot,
      endSlot: props.slot,
      startOffset: 0,
      endOffset: props.slot.length
    } : {
      startSlot: selection.startSlot!,
      startOffset: selection.startOffset!,
      endSlot: selection.endSlot!,
      endOffset: selection.endOffset!
    }
    const textAlignState = query.queryAttributeByRange(textAlignAttr, range)
    const textIndentState = query.queryAttributeByRange(textIndentAttr, range)

    checkStates.textAlign = textAlignState.state === QueryStateType.Enabled ? textAlignState.value! : 'left'
    checkStates.textIndent = textIndentState.state === QueryStateType.Enabled ? textIndentState.value! : 0
  }

  updateCheckStates()

  const subscription = refreshService.onRefresh.subscribe(() => {
    updateCheckStates()
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  function updateAttr(value: any) {
    props.applyBefore?.()
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

  const commonState = useCommonState()
  return () => {
    const b = commonState().inSourceCode || commonState().readonly
    return (
      <Dropdown block={props.inLeftTool}
                orientation={props.inLeftTool ? 'horizontal' : 'vertical'}
                disabled={b}
                trigger={'hover'} dropdown={
        <MenuList class="xnote-block-tool-root" columnCompact={true}>
          <MenuItem density={'compact'} onClick={() => updateAttr('t-l')} icon={<IconGlyph name={'paragraph-left'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('attr.alignLeft')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: 'L', modKey: true }}/>
                {checkStates.textAlign === 'left' && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => updateAttr('t-r')} icon={<IconGlyph name={'paragraph-right'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('attr.alignRight')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: 'R', modKey: true }}/>
                {checkStates.textAlign === 'right' && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => updateAttr('t-c')} icon={<IconGlyph name={'paragraph-center'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('attr.alignCenter')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: 'E', modKey: true }}/>
                {checkStates.textAlign === 'center' && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => updateAttr('t-j')} icon={<IconGlyph name={'paragraph-justify'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('attr.alignJustify')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: 'J', modKey: true }}/>
                {checkStates.textAlign === 'justify' && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <Divider spacing={'compact'}/>
          <MenuItem density={'compact'} onClick={() => updateAttr('i+')} icon={<IconGlyph name={'indent-increase'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('attr.indentIncrease')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: 'Tab' }}/>
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => updateAttr('i-')} icon={<IconGlyph name={'indent-decrease'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('attr.indentDecrease')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: 'Tab', shiftKey: true }}/>
              </span>
            </div>
          </MenuItem>
        </MenuList>
      }>
        {
          props.children || <Button disabled={b} chevronGapless={true} inlineCompact={true} variant={'text'} size={'small'}>
            <IconGlyph name={'paragraph-' + (checkStates.textAlign || 'left') as any}/>
          </Button>
        }
      </Dropdown>
    )
  }
}
