import { withScopedCSS } from '@viewfly/scoped-css'
import { Button, Dropdown, MenuItem, Divider, MenuList } from '@viewfly/ui-components'

import css from './block-tool.scoped.scss'
import { useActiveBlock } from '../hooks/active-block'
import { useBlockTransform } from '../hooks/block-transform'
import { Keymap } from '../../components/keymap/keymap'
import { useCommonState } from './_common/common-state'
import { IconGlyph } from '@viewfly/ui-icons'
import { JSXNode } from '@viewfly/core'

export function BlockTool() {
  const checkStates = useActiveBlock()
  const transform = useBlockTransform()

  const commonState = useCommonState()
  return withScopedCSS(css, () => {
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
    const b = commonState().inSourceCode || commonState().readonly

    return (
      <Dropdown disabled={b} trigger={'hover'} dropdown={
        <MenuList class={'w-44'} columnCompact={true}>
          <MenuItem density={'compact'} onClick={() => transform('paragraph')} icon={<IconGlyph name={'pilcrow'}/>}>
            <div class={'flex justify-between'}>
              正文
              <span class={'flex items-center'}>
                <Keymap keymap={{
                  modKey: true,
                  key: '0'
                }}/>
                {states.paragraph && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h1')} icon={<IconGlyph name={'heading-h1'}/>}>
            <div class={'flex justify-between'}>
              一级标题
              <span class={'flex items-center'}>
                <Keymap keymap={{
                  modKey: true,
                  key: '1'
                }}/>
                {states.h1 && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h2')} icon={<IconGlyph name={'heading-h2'}/>}>
            <div class={'flex justify-between'}>
              二级标题
              <span class={'flex items-center'}>
                <Keymap keymap={{
                  modKey: true,
                  key: '2'
                }}/>
                {states.h2 && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h3')} icon={<IconGlyph name={'heading-h3'}/>}>
            <div class={'flex justify-between'}>
              三级标题
              <span class={'flex items-center'}>
                <Keymap keymap={{
                  modKey: true,
                  key: '3'
                }}/>
                {states.h3 && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h4')} icon={<IconGlyph name={'heading-h4'}/>}>
            <div class={'flex justify-between'}>
              四级标题
              <span class={'flex items-center'}>
                <Keymap keymap={{
                  modKey: true,
                  key: '4'
                }}/>
                {states.h4 && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h5')} icon={<IconGlyph name={'heading-h5'}/>}>
            <div class={'flex justify-between'}>
              五级标题
              <span class={'flex items-center'}>
                <Keymap keymap={{
                  modKey: true,
                  key: '5'
                }}/>
                {states.h5 && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('h6')} icon={<IconGlyph name={'heading-h6'}/>}>
            <div class={'flex justify-between'}>
              六级标题
              <span class={'flex items-center'}>
                <Keymap keymap={{
                  modKey: true,
                  key: '6'
                }}/>
                {states.h6 && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <Divider spacing={'compact'}/>
          <MenuItem density={'compact'} onClick={() => transform('todolist')} icon={<IconGlyph name={'checkbox-checked'}/>}>
            <div class={'flex justify-between'}>
              待办事项
              <span class={'flex items-center'}>
                {states.todolist && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('ol')} icon={<IconGlyph name={'list-numbered'}/>}>
            <div class={'flex justify-between'}>
              有序列表
              <span class={'flex items-center'}>
                <Keymap keymap={{ key: 'O', shiftKey: true, modKey: true }}/>
                {states.orderedList && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('ul')} icon={<IconGlyph name={'list'}/>}>
            <div class={'flex justify-between'}>
              无序列表
              <span class={'flex items-center'}>
                <Keymap keymap={{ key: 'U', shiftKey: true, modKey: true }}/>
                {states.unorderedList && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('blockquote')} icon={<IconGlyph name={'quotes-right'}/>}>
            <div class="flex justify-between">
              引用
              <span class={'flex items-center'}>
                <Keymap keymap={{ key: '\'', modKey: true }}/>
                {states.blockquote && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('sourceCode')} icon={<IconGlyph name={'source-code'}/>}>
            <div class="flex justify-between">
              代码块
              <span class={'flex items-center'}>
                {states.sourceCode && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
              </span>
            </div>
          </MenuItem>
          <MenuItem density={'compact'} onClick={() => transform('highlightBox')} icon={<IconGlyph name={'hightlight-box'}/>}>
            <div class={'flex justify-between'}>
              高亮块
              <span class={'flex items-center'}>
                {states.highlightBox && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
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
  })
}
