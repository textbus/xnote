import { inject, onUnmounted, reactive } from '@viewfly/core'
import { Selection } from '@textbus/core'
import { Button, MenuItem } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { RefreshService } from '../../../services/refresh.service'
import { TableComponent } from '../../../textbus/components/table/table.component'
import { getTableSlotBySlot, isInTable } from './help'
import { useCommonState } from '../_common/common-state'
import { I18nService } from '../../../services/i18n.service'

export interface MergeCellsToolProps {
  inMenu?: boolean
}

export function MergeCellsTool(props: MergeCellsToolProps) {
  const i18n = inject(I18nService)
  const refreshService = inject(RefreshService)
  const selection = inject(Selection)

  const viewModel = reactive({
    highlight: false,
    disabled: false,
  })

  function merge() {
    const commonAncestorComponent = selection.commonAncestorComponent
    if (commonAncestorComponent instanceof TableComponent) {
      commonAncestorComponent.mergeCellBySelection()
    }
  }

  const sub = refreshService.onRefresh.subscribe(() => {
    const is = isInTable(selection)
    if (is) {
      const p1 = getTableSlotBySlot(selection.startSlot)
      const p2 = getTableSlotBySlot(selection.endSlot)
      if (p1 && p2) {
        viewModel.disabled = p1 === p2
        return
      }
    }
    viewModel.disabled = true
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const commonState = useCommonState()

  return () => {
    if(props.inMenu) {
      return (
        <MenuItem density={'compact'} icon={<IconGlyph name={'merge-cells'}/>} onClick={merge}
                  disabled={viewModel.disabled || commonState().readonly || commonState().inSourceCode}>
          {i18n.t('table.mergeCells')}
        </MenuItem>
      )
    }
    return <Button highlighted={viewModel.highlight}
                   size={'small'}
                   variant={'text'}
                   inlineCompact={true}
                   chevronGapless={true}
                   disabled={viewModel.disabled || commonState().readonly || commonState().inSourceCode}
                   onClick={merge}>
      <IconGlyph name={'merge-cells'}/>
    </Button>
  }
}
