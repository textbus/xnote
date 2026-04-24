import { createSignal, inject, reactive, withMark } from '@viewfly/core'
import { delay, Query, QueryStateType, Selection } from '@textbus/core'
import { SelectionBridge, VIEW_CONTAINER } from '@textbus/platform-browser'

import css from './link-jump.scoped.scss'
import { linkFormatter } from '../../textbus/formatters/link'
import { Button, Popover, Space } from '@viewfly/ui-components'

export const LinkJump = withMark(css, () => {
  const selection = inject(Selection)
  const query = inject(Query)
  const bridge = inject(SelectionBridge)
  const container = inject(VIEW_CONTAINER)

  const href = createSignal('')
  const isShow = createSignal(false)

  const rect = reactive({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })

  function updatePosition(setHref?: (href: string) => void) {
    if (selection.isCollapsed) {
      const queryState = query.queryFormat(linkFormatter)
      if (queryState.state === QueryStateType.Enabled) {
        const refRect = bridge.getRect({
          slot: selection.focusSlot!,
          offset: selection.focusOffset!
        })
        if (refRect) {
          rect.left = refRect.left
          rect.top = refRect.top
          rect.width = refRect.width
          rect.height = refRect.height
          isShow.set(true)
          setHref?.(queryState.value!.href)
          return
        }
      }
    }
    isShow.set(false)
  }

  function onSelectionChange() {
    updatePosition(url => {
      if (url.indexOf('://') < 0) {
        url = 'http://' + url
      }
      href.set(url)
    })
  }

  selection.onChange.pipe(delay()).subscribe(() => {
    onSelectionChange()
  })

  function cleanLink() {
    isShow.set(false)
    const commonAncestorSlot = selection.commonAncestorSlot!
    const index = selection.focusOffset!
    const ranges = commonAncestorSlot.getFormatRangesByFormatter(linkFormatter, 0, commonAncestorSlot.length)
    ranges.forEach(range => {
      if (range.startIndex < index && range.endIndex >= index) {
        commonAncestorSlot.applyFormat(linkFormatter, {
          startIndex: range.startIndex,
          endIndex: range.endIndex,
          value: null
        })
      }
    })
  }

  return () => (
    <Popover
      style={{
        minWidth: 0,
        padding: '3px'
      }}
      bordered={false}
      open={isShow()}
      getReferenceBox={() => {
        updatePosition()
        return rect
      }}
      onOpenChange={b => {
        isShow.set(b)
      }}
      content={
        <Space.Compact>
          <Button onClick={cleanLink} variant={'text'} size={'small'}>清除</Button>
          <Button target={'_blank'} href={href()} variant={'link'} size={'small'}>跳转</Button>
        </Space.Compact>
      }
      getContainer={() => container}>
    </Popover>
  )
})
