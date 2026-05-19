import { Commander, ContentType, createVNode, Slot, Textbus } from '@textbus/core'
import { ViewComponentProps } from '@textbus/adapter-viewfly'
import { ComponentLoader, DomAdapter, SlotParser } from '@textbus/platform-browser'
import { createRef, createSignal, inject, onUnmounted, withAnnotation } from '@viewfly/core'
import { v4 } from 'uuid'
import { Button, ColorPicker, Divider, Dropdown, MenuItem, MenuList, Picker } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import './table.component.scss'
import { Row, TableComponent } from './table.component'
import { ResizeColumn } from './components/resize-column'
import { TopBar } from './components/top-bar'
import { Scroll } from './components/scroll'
import { LeftBar } from './components/left-bar'
import { isShowMask, TableService } from './table.service'
import { ResizeRow } from './components/resize-row'
import { SelectionMask } from './components/selection-mask'
import { deltaToBlock } from '../paragraph/paragraph.component'
import { useReadonly } from '../../hooks/use-readonly'
import { useOutput } from '../../hooks/use-output'
import { EditorService } from '../../../services/editor.service'
import { autoComplete, TableCellConfig } from './tools/complete'
import { I18nService } from '../../../services/i18n.service'
import { cellAlignAttr } from '../../attributes/cell-align.attr'
import { cellBackgroundAttr } from '../../attributes/cell-background.attr'

export const TableComponentView = withAnnotation({
  providers: [TableService]
}, function TableComponentView(props: ViewComponentProps<TableComponent>) {
  const adapter = inject(DomAdapter)
  const editorService = inject(EditorService)
  const i18n = inject(I18nService)
  const commander = inject(Commander)

  const isFocus = createSignal(false)
  const layoutWidth = createSignal(props.component.state.columnsConfig)
  const subscription = props.component.focus.subscribe(b => {
    isFocus.set(b)
    if (!b) {
      editorService.hideInlineToolbar = false
    }
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  function resetIgnore() {
    props.component.ignoreSelectionChanges = false
  }

  const tableRef = createRef<HTMLTableElement>()

  const isResizeColumn = createSignal(false)

  const rowMapping = new WeakMap<Row, number>()

  const readonly = useReadonly()
  const output = useOutput()

  function setCellAlign(v: string) {
    const slots = props.component.getSelectedNormalizedSlots() || []

    slots.forEach(item => {
      item.cells.forEach(cell => {
        if (cell.visible) {
          cell.raw.slot.setAttribute(cellAlignAttr, v)
        }
      })
    })
  }

  function setColor(picker: Picker) {
    const rgba = picker.rgba
    const c = rgba ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})` : ''
    const slots = props.component.getSelectedNormalizedSlots()
    if (slots) {
      slots.map(i => {
        return i.cells.filter(t => t.visible).map(i => i.raw.slot)
      }).flat().forEach(slot => {
        if (c) {
          slot.setAttribute(cellBackgroundAttr, c, s => {
            return slot === s
          })
        } else {
          slot.removeAttribute(cellBackgroundAttr)
        }
      })
    }
  }

  return () => {
    const normalizedData = props.component.getNormalizedData()
    const state = props.component.state
    // const rows = state.rows

    normalizedData.forEach(row => {
      if (rowMapping.has(row.row)) {
        return
      }
      rowMapping.set(row.row, Math.random())
    })

    if (readonly() || output()) {
      return (
        <div class="xnote-table"
             data-component={props.component.name}
             data-layout-width={`[${state.columnsConfig.join(',')}]`}
        >
          <div class="xnote-table-inner" ref={props.rootRef}>
            <div class="xnote-table-container" style={{
              overflow: 'auto'
            }}>
              <table class={[
                'xnote-table-content',
                {
                  'hide-selection': props.component.tableSelection()
                }
              ]}>
                <colgroup>
                  {
                    state.columnsConfig.map(w => {
                      return <col style={{ width: w + 'px', minWidth: w + 'px' }}/>
                    })
                  }
                </colgroup>
                <tbody>
                {
                  normalizedData.map((row) => {
                    return (
                      <tr class="xnote-table-row" key={rowMapping.get(row.row)}>
                        {
                          row.cells.filter(i => {
                            return i.visible
                          }).map(cell => {
                            return adapter.slotRender(cell.raw.slot, children => {
                              return createVNode('td', {
                                key: cell.raw.id,
                                rowspan: cell.rowspan,
                                colspan: cell.colspan
                              }, children)
                            }, readonly() || output())
                          })
                        }
                      </tr>
                    )
                  })
                }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    const showMask = isShowMask(props.component) && isFocus()
    return (
      <div class="xnote-table"
           data-component={props.component.name}
           data-layout-width={`[${state.columnsConfig.join(',')}]`}>
        <div class="xnote-table-inner" ref={props.rootRef}>
          <TopBar
            isFocus={isFocus}
            layoutWidth={layoutWidth}
            component={props.component}
          />
          <LeftBar
            tableRef={tableRef}
            isFocus={isFocus}
            component={props.component}/>
          <Scroll isFocus={isFocus}>
            <div class="xnote-table-container">
              <table ref={tableRef} class={[
                'xnote-table-content',
                {
                  'hide-selection': showMask
                }
              ]}>
                <colgroup>
                  {
                    layoutWidth().map(w => {
                      return <col style={{ width: w + 'px', minWidth: w + 'px' }}/>
                    })
                  }
                </colgroup>
                <tbody onMousedown={resetIgnore}>
                {
                  normalizedData.map((row) => {
                    return (
                      <tr key={rowMapping.get(row.row)}>
                        {
                          row.cells.filter(i => {
                            return i.visible
                          }).map(cell => {
                            return adapter.slotRender(cell.raw.slot, children => {
                              return createVNode('td', {
                                key: cell.raw.id,
                                rowspan: cell.rowspan,
                                colspan: cell.colspan
                              }, children)
                            }, readonly() || output())
                          })
                        }
                      </tr>
                    )
                  })
                }
                </tbody>
              </table>
              {showMask && <SelectionMask tableRef={tableRef} component={props.component}/>}
            </div>
          </Scroll>
          <ResizeColumn
            tableRef={tableRef}
            component={props.component}
            layoutWidth={layoutWidth}
            onActiveStateChange={isActive => {
              isResizeColumn.set(isActive)
            }}/>
          <ResizeRow component={props.component} tableRef={tableRef}/>
          {
            isFocus() && (
              <div class="xnote-table-tool">
                <Button disabled={!showMask} inlineCompact={true} onClick={() => {
                  props.component.mergeCellBySelection()
                }}><IconGlyph name={'merge-cells'}/></Button>
                <Button disabled={!props.component.canSplit()} inlineCompact={true} onClick={() => {
                  props.component.splitCellsBySelection()
                }}>
                  <IconGlyph name={'split-cells'}/>
                </Button>
                <Dropdown trigger={'hover'} orientation={'horizontal'} horizontalPanelAlign={'middle'}
                          horizontalAlign={'right'} dropdown={
                  <MenuList columnCompact={true} class="xnote-w-menu-40">
                    <MenuItem density={'compact'} onClick={() => setCellAlign('top')} icon={<IconGlyph name={'align-top'}/>}>
                      <div class="xnote-flex-between">
                        {i18n.t('cellAlign.top')}
                      </div>
                    </MenuItem>
                    <MenuItem density={'compact'} onClick={() => setCellAlign('middle')} icon={<IconGlyph name={'align-middle'}/>}>
                      <div class="xnote-flex-between">
                        {i18n.t('cellAlign.middle')}
                      </div>
                    </MenuItem>
                    <MenuItem density={'compact'} onClick={() => setCellAlign('bottom')} icon={<IconGlyph name={'align-bottom'}/>}>
                      <div class="xnote-flex-between">
                        {i18n.t('cellAlign.bottom')}
                      </div>
                    </MenuItem>
                  </MenuList>
                }>
                  <Button chevronGapless={true} chevronDown={false} inlineCompact={true}><IconGlyph name={'align-middle'}/></Button>
                </Dropdown>
                <Dropdown trigger={'hover'}
                          horizontalAlign={'right'}
                          horizontalPanelAlign={'middle'}
                          orientation={'horizontal'} dropdown={
                  <ColorPicker recentColorsLabel={i18n.t('colorPicker.recentColorsLabel')}
                               paletteTriggerLabel={i18n.t('colorPicker.paletteTriggerLabel')}
                               confirmLabel={i18n.t('colorPicker.confirmLabel')}
                               recentColorsName={'tableCellBackgroundColor'} onSelected={setColor}
                  />}>
                  <Button chevronGapless={true} chevronDown={false} inlineCompact={true}><IconGlyph name={'palette'}/></Button>
                </Dropdown>
                <Divider spacing={'compact'}/>
                <Button inlineCompact={true} onClick={() => {
                  commander.removeComponent(props.component)
                }}>
                  <IconGlyph name={'bin'}/>
                </Button>
              </div>
            )
          }
        </div>
      </div>
    )
  }
})

export const tableComponentLoader: ComponentLoader = {
  match(element: HTMLElement): boolean {
    return element.dataset.component === TableComponent.componentName || element.tagName === 'TABLE'
  },
  read(element: HTMLElement, textbus: Textbus, slotParser: SlotParser): TableComponent | Slot | void {
    let content: HTMLElement = element
    if (element.tagName === 'DIV') {
      content = element.querySelector('.xnote-table-content') as HTMLTableElement
      if (!content) {
        return
      }
    }
    const { tHead, tBodies, tFoot } = content as HTMLTableElement
    const headers: TableCellConfig[][] = []
    const bodies: TableCellConfig[][] = []
    if (tHead) {
      Array.from(tHead.rows).forEach(row => {
        const arr: TableCellConfig[] = []
        headers.push(arr)
        Array.from(row.cells).forEach(cell => {
          const slot = new Slot([
            ContentType.BlockComponent,
          ])
          arr.push({
            id: v4(),
            slot,
            rowspan: cell.rowSpan,
            colspan: cell.colSpan
          })
          const delta = slotParser(new Slot([
            ContentType.BlockComponent,
            ContentType.InlineComponent,
            ContentType.Text
          ]), cell).toDelta()

          const results = deltaToBlock(delta)
          delta.attributes.forEach((value, key) => {
            slot.setAttribute(key, value)
          })
          results.forEach(i => {
            slot.insert(i)
          })
        })
      })
    }

    if (tBodies) {
      Array.of(...Array.from(tBodies), tFoot || { rows: [] }).reduce((value, next) => {
        return value.concat(Array.from(next.rows))
      }, [] as HTMLTableRowElement[]).forEach((row: HTMLTableRowElement) => {
        const arr: TableCellConfig[] = []
        bodies.push(arr)
        Array.from(row.cells).forEach(cell => {
          const slot = new Slot([
            ContentType.BlockComponent,
          ])
          arr.push({
            id: v4(),
            slot,
            rowspan: cell.rowSpan,
            colspan: cell.colSpan
          })
          const delta = slotParser(new Slot([
            ContentType.BlockComponent,
            ContentType.InlineComponent,
            ContentType.Text
          ]), cell).toDelta()

          const results = deltaToBlock(delta)
          delta.attributes.forEach((value, key) => {
            slot.setAttribute(key, value)
          })
          results.forEach(i => {
            slot.insert(i)
          })
        })
      })
    }
    bodies.unshift(...headers)

    const cells = autoComplete(bodies)

    let layoutWidth: number[] = []

    try {
      const columnWidth = JSON.parse(element.dataset.layoutWidth || '')
      if (Array.isArray(columnWidth)) {
        layoutWidth = columnWidth
      }
    } catch (e) {
      //
    }

    const length = cells.table[0].length

    for (let i = 0; i < length; i++) {
      layoutWidth[i] = layoutWidth[i] || 100
    }

    layoutWidth.length = length


    return new TableComponent({
      columnsConfig: layoutWidth,
      mergeConfig: cells.mergedConfig,
      rows: cells.table.map(i => {
        return {
          height: 30,
          cells: i
        }
      })
    })
  }
}


