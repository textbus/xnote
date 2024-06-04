import { createRef, createSignal, inject } from '@viewfly/core'
import { delay, Selection } from '@textbus/core'
import { withScopedCSS } from '@viewfly/scoped-css'
import { SelectionBridge, VIEW_CONTAINER } from '@textbus/platform-browser'
import { createPortal } from '@viewfly/platform-browser'

import css from './link-jump.scoped.scss'
import { linkFormatter } from '../../textbus/formatters/link'

function getLinkByDOMTree(node: HTMLElement): HTMLLinkElement | null {
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.tagName.toLowerCase() === 'a') {
      return node as HTMLLinkElement
    }
    if (node.parentNode) {
      return getLinkByDOMTree(node.parentNode as HTMLElement)
    }
  }
  return null
}


export function LinkJump() {
  const selection = inject(Selection)
  const bridge = inject(SelectionBridge)
  const container = inject(VIEW_CONTAINER)

  const href = createSignal('')
  const ref = createRef<HTMLElement>()
  const isShow = createSignal(false)

  function onSelectionChange() {
    const nativeSelection = document.getSelection()!
    const firstNativeRange = nativeSelection.rangeCount ? nativeSelection.getRangeAt(0) : null
    if (firstNativeRange) {
      const focusNode = firstNativeRange.commonAncestorContainer
      if (focusNode) {
        const node = (focusNode.nodeType === Node.TEXT_NODE ? focusNode.parentNode : focusNode) as HTMLElement
        const linkElement = getLinkByDOMTree(node)
        if (linkElement && (linkElement.href || linkElement.dataset.href)) {
          href.set(linkElement.href || linkElement.dataset.href || '')
          const rect = bridge.getRect({
            slot: selection.startSlot!,
            offset: selection.startOffset!
          })!

          const offsetRect = container.getBoundingClientRect()
          if (nativeSelection.isCollapsed) {
            Object.assign(ref.current!.style, {
              left: rect.left - offsetRect.left + 'px',
              top: rect.top - offsetRect.top + 'px'
            })
          } else {
            const rect2 = bridge.getRect({
              slot: selection.endSlot!,
              offset: selection.endOffset!
            })!
            Object.assign(ref.current!.style, {
              left: (rect.left + rect2.left) / 2 - offsetRect.left + 'px',
              top: rect.top - offsetRect.top + 'px'
            })
          }

          isShow.set(true)
          return
        }
      }
    }
    isShow.set(false)
  }

  selection.onChange.pipe(delay()).subscribe(() => {
    onSelectionChange()
  })

  function cleanLink() {
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

  return createPortal(
    withScopedCSS(css, () => {
      return (
        <div ref={ref} class="link-jump-plugin" style={{ display: isShow() ? '' : 'none' }}>
          <span onClick={cleanLink}>清除</span>
          <a target="_blank" href={href()}>跳转</a>
        </div>
      )
    }), container
  )
}
