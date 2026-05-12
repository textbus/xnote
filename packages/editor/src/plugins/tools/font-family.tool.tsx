import { inject, onUnmounted, createSignal } from '@viewfly/core'
import { Commander, Query, QueryStateType } from '@textbus/core'

import { RefreshService } from '../../services/refresh.service'
import { I18nService } from '../../services/i18n.service'
import { fontFamilyFormatter } from '../../textbus/formatters/font-family'
import { useCommonState } from './_common/common-state'
import { Button, Dropdown, MenuItem, MenuList } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

export const isSupportFont = (function () {
  const fullbackFontName = 'Arial'
  const text = 'HeRe-is*SoMe%tEst +99.? !@ #~ &^teXtWw L$VEY$U0'
  const fontSize = 20
  const width = 200
  const height = 50
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = width
  canvas.height = height
  context.textAlign = 'center'
  context.fillStyle = 'black'
  context.textBaseline = 'middle'

  function checker(fontName: string) {
    context.clearRect(0, 0, width, height)
    context.font = fontSize + 'px ' + fontName + ', ' + fullbackFontName
    context.fillText(text, width / 2, height / 2)
    const data: Uint8ClampedArray = context.getImageData(0, 0, width, height).data
    return Array.from(data).filter(n => n !== 0)
  }

  const cache = new Map<string, boolean>()
  return function (fontName: string) {
    if (fontName.toLowerCase() === fullbackFontName.toLowerCase()) {
      return true
    }
    if (cache.has(fontName)) {
      return cache.get(fontName)
    }
    const b = checker(fullbackFontName).join('') !== checker(fontName).join('')
    cache.set(fontName, b)
    return b
  }
})()

export function FontFamilyTool() {
  const i18n = inject(I18nService)
  const currentFontFamily = createSignal('')
  const fontFamilyOptions = [{
    label: i18n.t('fontFamily.default'),
    value: ''
  }, {
    label: i18n.t('fontFamily.simsun'),
    value: 'SimSun, STSong'
  }, {
    label: i18n.t('fontFamily.simhei'),
    value: 'SimHei, STHeiti'
  }, {
    label: i18n.t('fontFamily.microsoftYahei'),
    value: 'Microsoft YaHei'
  }, {
    label: i18n.t('fontFamily.kaiti'),
    value: 'KaiTi, STKaiti'
  }, {
    label: i18n.t('fontFamily.fangsong'),
    value: 'FangSong, STFangsong',
  }, {
    label: i18n.t('fontFamily.hiragino'),
    value: '"Hiragino Sans GB", 冬青黑简体中文'
  }, {
    label: i18n.t('fontFamily.pingfang'),
    value: '"PingFang SC", 苹方'
  }, {
    label: i18n.t('fontFamily.simli'),
    value: 'SimLi'
  }, {
    label: 'Andale Mono',
    value: 'Andale Mono'
  }, {
    label: 'Arial',
    value: 'Arial'
  }, {
    label: 'Helvetica',
    value: 'Helvetica'
  }, {
    label: 'Impact',
    value: 'Impact'
  }, {
    label: 'Times New Roman',
    value: 'Times New Roman'
  }]

  const commander = inject(Commander)

  function check(v: string) {
    if (v) {
      commander.applyFormat(fontFamilyFormatter, v)
    } else {
      commander.unApplyFormat(fontFamilyFormatter)
    }
  }

  const refreshService = inject(RefreshService)
  const query = inject(Query)

  const highlight = createSignal(false)

  const subscription = refreshService.onRefresh.subscribe(() => {
    const result = query.queryFormat(fontFamilyFormatter)
    const isHighlight = result.state === QueryStateType.Enabled
    highlight.set(isHighlight)
    currentFontFamily.set(isHighlight ? result.value! : '')
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const commonState = useCommonState()

  return () => {
    const b = commonState().inSourceCode || commonState().readonly || commonState().selectEmbed
    return (
      <Dropdown disabled={b} trigger={'hover'} dropdown={
        <MenuList class={'w-40'} columnCompact={true}>
          {
            fontFamilyOptions.map(i => {
              const disabled = i.value ? !i.value.split(',').map(i => isSupportFont(i.trim())).some(v => v) : false
              return <MenuItem disabled={disabled} onClick={() => check(i.value)} density={'compact'}>
                <div class={'flex justify-between flex-1'}>
                  {i.label || i18n.t('fontFamily.default')}
                  {currentFontFamily() === i.value && <IconGlyph class={'ml-1 color-primary'} name={'checkmark'}/>}
                </div>
              </MenuItem>
            })
          }
        </MenuList>
      }>
        <Button disabled={b} variant={'text'} chevronGapless={true} inlineCompact={true} size={'small'}
                highlighted={highlight()} class={'text-nowrap'}>{
          fontFamilyOptions.find(v => {
            return v.value === currentFontFamily()
          })?.label || i18n.t('fontFamily.default')}
        </Button>
      </Dropdown>
    )
  }
}
