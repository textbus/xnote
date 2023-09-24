import { useProduce } from '@viewfly/hooks'
import { inject, onUnmounted, createSignal } from '@viewfly/core'
import { Commander, Query, QueryStateType } from '@textbus/core'
import { withScopedCSS } from '@viewfly/scoped-css'

import { Button } from '../../components/button/button'
import { RefreshService } from '../../services/refresh.service'
import { backgroundColorFormatter, colorFormatter } from '../../textbus/formatters/_api'
import { Dropdown } from '../../components/dropdown/dropdown'
import css from './color-tool.scoped.scss'

export function ColorTool() {
  const query = inject(Query)
  const refreshService = inject(RefreshService)
  const commander = inject(Commander)

  const textColor = createSignal('')
  const backgroundColor = createSignal('')

  const [viewModel] = useProduce({
    highlight: false,
    disabled: false,
  })

  const sub = refreshService.onRefresh.subscribe(() => {
    const textState = query.queryFormat(colorFormatter)
    const backgroundState = query.queryFormat(backgroundColorFormatter)

    textColor.set(textState.state === QueryStateType.Enabled ? textState.value! : '')
    backgroundColor.set(backgroundState.state === QueryStateType.Enabled ? backgroundState.value! : '')
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const textColors: string[] = [
    '#aaa',
    '#ff2e2e',
    '#ff8d45',
    '#ffdf14',
    '#5eec75',
    '#5dfaff',
    '#617fff',
    '#c459ff',
  ]

  const backgroundColors: string[] = [
    '#aaa',
    '#ef7373',
    '#ec9c6a',
    '#dccc64',
    '#96e3a3',
    '#a1e2e3',
    '#90a0e5',
    '#c596e0',
  ]

  return withScopedCSS(css, () => {
    const vm = viewModel()
    return (
      <Dropdown trigger={'hover'} menu={
        <div>
          <div class="color-type">文字颜色</div>
          <div class="text-colors">
            <div class={{
              active: textColor() === ''
            }} onClick={() => {
              commander.unApplyFormat(colorFormatter)
            }}>A
            </div>
            {
              textColors.map(c => {
                return <div class={{
                  active: textColor() === c
                }} onClick={() => {
                  commander.applyFormat(colorFormatter, c)
                }} style={{ color: c }}>A</div>
              })
            }
          </div>
          <div class="color-type">背景颜色</div>
          <div class="background-colors">
            <div class={{
              active: backgroundColor() === '',
              'no-background': true
            }} onClick={() => {
              commander.unApplyFormat(backgroundColorFormatter)
            }}></div>
            {
              backgroundColors.map(c => {
                return <div class={{
                  active: backgroundColor() === c
                }} onClick={() => {
                  commander.applyFormat(backgroundColorFormatter, c)
                }} style={{ backgroundColor: c }}>A</div>
              })
            }
          </div>
        </div>
      }>
        <Button highlight={vm.highlight} arrow={true} disabled={vm.disabled}>
          <span class="background">
            <span style={{
              backgroundColor: backgroundColor(),
              color: textColor()
            }}>
              <span class="xnote-icon-color"></span>
            </span>
          </span>
        </Button>
      </Dropdown>
    )
  })
}
