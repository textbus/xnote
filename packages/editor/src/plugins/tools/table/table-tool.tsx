import { Button, Dropdown, MenuList } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'
import { createSignal, inject, onUnmounted } from '@viewfly/core'
import { Selection } from '@textbus/core'

import { RefreshService } from '../../../services/refresh.service'
import { isInTable } from './help'
import { useCommonState } from '../_common/common-state'
import { CellAlignTool } from './cell-align.tool'
import { MergeCellsTool } from './merge-cells.tool'
import { SplitCellsTool } from './split-cells.tool'
import { CellBackgroundTool } from './cell-background.tool'

export function TableTool() {
  const refreshService = inject(RefreshService)
  const selection = inject(Selection)

  const disabled = createSignal(false)

  const subscription = refreshService.onRefresh.subscribe(() => {
    disabled.set(!isInTable(selection))
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })


  const commonState = useCommonState()
  return () => {
    return (
      <Dropdown trigger={'hover'}
                disabled={disabled() || commonState().readonly}
                verticalPanelAlign={'right'}
                onOpenChange={(v) => {
                  if (v) {
                    setTimeout(() => {
                      refreshService.onRefresh.next()
                    })
                  }
                }}
                dropdown={
                  <MenuList style={{ width: '180px' }} columnCompact={true}>
                    <MergeCellsTool inMenu={true}/>
                    <SplitCellsTool inMenu={true}/>
                    <CellAlignTool inMenu={true}/>
                    <CellBackgroundTool inMenu={true}/>
                  </MenuList>
                }>
        <Button size={'small'}
                variant={'text'}
                inlineCompact={true}
                chevronGapless={true}>
          <IconGlyph name={'table'}/>
        </Button>
      </Dropdown>
    )
  }
}
