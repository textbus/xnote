import { Button, Dropdown, MenuItem, Divider, MenuList } from '@viewfly/ui-components'

import './block-tool.scss'
import { useActiveBlock } from '../hooks/active-block'
import { useBlockTransform } from '../hooks/block-transform'
import { Keymap } from '../../components/keymap/keymap'
import { useCommonState } from './_common/common-state'
import { IconGlyph } from '@viewfly/ui-icons'
import { inject, JSXNode } from '@viewfly/core'
import { RootComponentRef, Selection } from '@textbus/core'

import { MenuHeading } from '../../components/menu-heading/menu-heading'
import { I18nService } from '../../services/i18n.service'

export function BlockTool() {
  const i18n = inject(I18nService)
  const checkStates = useActiveBlock()
  const transform = useBlockTransform()
  const selection = inject(Selection)
  const rootComponentRef = inject(RootComponentRef)

  const commonState = useCommonState()
  return () => {
    const states = checkStates()
    const types: [boolean, JSXNode][] = [
      [states.paragraph, <IconGlyph name={'pilcrow'}/>],
      [states.h1, <IconGlyph name={'heading-h1'}/>],
      [states.h2, <IconGlyph name={'heading-h2'}/>],
      [states.h3, <IconGlyph name={'heading-h3'}/>],
      [states.h4, <IconGlyph name={'heading-h4'}/>],
      [states.h5, <IconGlyph name={'heading-h5'}/>],
      [states.h6, <IconGlyph name={'heading-h6'}/>],
      [states.orderedList, <IconGlyph name={'list-numbered'}/>],
      [states.unorderedList, <IconGlyph name={'list'}/>],
      [states.todolist, <IconGlyph name={'checkbox-checked'}/>],
      [states.blockquote, <IconGlyph name={'quotes-right'}/>],
      [states.sourceCode, <IconGlyph name={'source-code'}/>],
      [states.highlightBox, <IconGlyph name={'hightlight-box'}/>],
    ]

    let currentType: JSXNode = <IconGlyph name={'pilcrow'}/>

    for (const t of types) {
      if (t[0]) {
        currentType = t[1]
        break
      }
    }
    const b = commonState().inSourceCode ||
      commonState().readonly ||
      (selection.isCollapsed && selection.commonAncestorComponent === rootComponentRef.component) ||
      !selection.isSelected

    return (
      <Dropdown disabled={b} trigger={'hover'} dropdown={
        <MenuList class="xnote-w-menu-52 xnote-block-tool-root" columnCompact={true}>
          <MenuHeading>{i18n.t('block.replaceWith')}</MenuHeading>
          <MenuItem density={'compact'} onClick={() => transform('paragraph')} icon={<IconGlyph name={'pilcrow'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.paragraph')}
              <span class="xnote-flex-center">
                <Keymap keymap={{
                  modKey: true,
                  key: '0'
                }}/>
                {states.paragraph && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h1')} icon={<IconGlyph name={'heading-h1'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.heading1')}
              <span class="xnote-flex-center">
                <Keymap keymap={{
                  modKey: true,
                  key: '1'
                }}/>
                {states.h1 && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h2')} icon={<IconGlyph name={'heading-h2'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.heading2')}
              <span class="xnote-flex-center">
                <Keymap keymap={{
                  modKey: true,
                  key: '2'
                }}/>
                {states.h2 && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h3')} icon={<IconGlyph name={'heading-h3'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.heading3')}
              <span class="xnote-flex-center">
                <Keymap keymap={{
                  modKey: true,
                  key: '3'
                }}/>
                {states.h3 && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h4')} icon={<IconGlyph name={'heading-h4'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.heading4')}
              <span class="xnote-flex-center">
                <Keymap keymap={{
                  modKey: true,
                  key: '4'
                }}/>
                {states.h4 && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h5')} icon={<IconGlyph name={'heading-h5'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.heading5')}
              <span class="xnote-flex-center">
                <Keymap keymap={{
                  modKey: true,
                  key: '5'
                }}/>
                {states.h5 && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h6')} icon={<IconGlyph name={'heading-h6'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.heading6')}
              <span class="xnote-flex-center">
                <Keymap keymap={{
                  modKey: true,
                  key: '6'
                }}/>
                {states.h6 && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <Divider spacing={'compact'}/>
          <MenuItem density={'compact'} onClick={() => transform('todolist')} icon={<IconGlyph name={'checkbox-checked'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.task')}
              <span class="xnote-flex-center">
                {states.todolist && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('ol')} icon={<IconGlyph name={'list-numbered'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.orderedList')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: 'O', shiftKey: true, modKey: true }}/>
                {states.orderedList && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('ul')} icon={<IconGlyph name={'list'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.unorderedList')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: 'U', shiftKey: true, modKey: true }}/>
                {states.unorderedList && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('blockquote')} icon={<IconGlyph name={'quotes-right'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.blockquote')}
              <span class="xnote-flex-center">
                <Keymap keymap={{ key: '\'', modKey: true }}/>
                {states.blockquote && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('sourceCode')} icon={<IconGlyph name={'source-code'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.sourceCode')}
              <span class="xnote-flex-center">
                {states.sourceCode && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('highlightBox')} icon={<IconGlyph name={'hightlight-box'}/>}>
            <div class="xnote-flex-between">
              {i18n.t('block.highlightBox')}
              <span class="xnote-flex-center">
                {states.highlightBox && <IconGlyph class="xnote-menu-check-icon" name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
        </MenuList>
      }>
        <Button variant={'text'} chevronGapless={true} inlineCompact={true} disabled={b} size={'small'}>
          {currentType}
        </Button>
      </Dropdown>
    )
  }
}
