import { inject, onUnmounted, createSignal } from '@viewfly/core'
import { Commander, Query, QueryStateType } from '@textbus/core'
import { Button, Dropdown, MenuItem, MenuList } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { RefreshService } from '../../services/refresh.service'
import { fontSizeFormatter } from '../../textbus/formatters/font-size'
import { useCommonState } from './_common/common-state'

export function FontSizeTool() {
  const currentFontSize = createSignal('')
  const fontSizeOptions = [
    '',
    '12px',
    '13px',
    '14px',
    '15px',
    '16px',
    '18px',
    '20px',
    '22px',
    '26px',
    '30px',
    '36px',
    '48px',
    '72px',
  ]

  const commander = inject(Commander)

  function check(v: string) {
    if (v) {
      commander.applyFormat(fontSizeFormatter, v)
    } else {
      commander.unApplyFormat(fontSizeFormatter)
    }
  }

  const refreshService = inject(RefreshService)
  const query = inject(Query)

  const highlight = createSignal(false)

  const subscription = refreshService.onRefresh.subscribe(() => {
    const result = query.queryFormat(fontSizeFormatter)
    const isHighlight = result.state === QueryStateType.Enabled
    highlight.set(isHighlight)
    currentFontSize.set(isHighlight ? result.value! : '')
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const commonState = useCommonState()

  return () => {
    const b = commonState().inSourceCode || commonState().readonly || commonState().selectEmbed
    return (
      <Dropdown disabled={b} dropdown={
        <MenuList class={'w-40'}>
          {
            fontSizeOptions.map(i => {
              return <MenuItem density={'compact'} onClick={() => check(i)}>
                <div class={'flex justify-between flex-1'}>
                  {i || '默认'}
                  {currentFontSize() === i && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
                </div>
              </MenuItem>
            })
          }
        </MenuList>
      }>
        <Button size={'small'} disabled={b} variant={'text'} chevronGapless={true} inlineCompact={true} highlighted={highlight()}>
          <IconGlyph name={'font-size'}/>
          <span>{currentFontSize() || '默认'}</span>
        </Button>
      </Dropdown>
    )
  }
}
