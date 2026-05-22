import { createSignal, inject } from '@viewfly/core'
import { Component } from '@textbus/core'
import { IconGlyph } from '@viewfly/ui-icons'
import { Button, Divider, Dropdown, MenuItem, MenuList } from '@viewfly/ui-components'

import './insert-menu.scss'
import { MenuHeading } from '../../components/menu-heading/menu-heading'
import { I18nService } from '../../services/i18n.service'
import { CreateTable, TableParams } from './table/create-table'
import { useBlockInsert } from '../hooks/block-insert'

export interface InsertMenuProps {
  component?: Component<any> | null
  hideTitle?: boolean
  replace?: boolean
  onInserted?: () => void
}

export function InsertMenu(props: InsertMenuProps) {
  const i18n = inject(I18nService)

  const tableParams = createSignal<TableParams>({
    row: 0,
    column: 0,
  })


  const insertBlock = useBlockInsert(tableParams)

  function insert(type: string) {
    insertBlock(type, props.replace, props.component)
    props.onInserted?.()
  }

  const closeTick = createSignal(0)

  return () => {
    return <div class="xnote-insert-menu">
      {
        props.hideTitle ? null : <MenuHeading>{props.replace ? i18n.t('insert.replaceWith') : i18n.t('insert.addBelow')}</MenuHeading>
      }
      <div class="xnote-insert-menu-grid">
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
        <Dropdown trigger={'hover'} orientation={'horizontal'} closeTick={closeTick} horizontalAlign={'right'} block dropdown={
          <CreateTable onChange={(params) => {
            tableParams.set(params)
            closeTick.set(Math.random())
            insert('table')
          }}/>
        }>
          <MenuItem density={'compact'} chevronRight={true} icon={<IconGlyph name={'table'}/>}>{i18n.t('insert.table')}</MenuItem>
        </Dropdown>
        <MenuItem density={'compact'} onClick={() => insert('todolist')}
                  icon={<IconGlyph name={'checkbox-checked'}/>}>{i18n.t('insert.todoList')}</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('image')} icon={<IconGlyph name={'image'}/>}>{i18n.t('insert.image')}</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('video')} icon={<IconGlyph name={'video'}/>}>{i18n.t('insert.video')}</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('highlightBox')}
                  icon={<IconGlyph name={'hightlight-box'}/>}>{i18n.t('insert.highlightBox')}</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('katex')}
                  icon={<IconGlyph name={'function'}/>}>{i18n.t('insert.katex')}</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('mermaid')}
                  icon={<IconGlyph name={'flow-chart'}/>}>{i18n.t('insert.mermaid')}</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('step')} icon={<IconGlyph name={'step'}/>}>{i18n.t('insert.step')}</MenuItem>
        <MenuItem density={'compact'} onClick={() => insert('timeline')}
                  icon={<IconGlyph name={'timeline'}/>}>{i18n.t('insert.timeline')}</MenuItem>
      </MenuList>
    </div>
  }
}
