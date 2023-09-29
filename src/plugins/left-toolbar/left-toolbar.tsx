import { withScopedCSS } from '@viewfly/scoped-css'
import {
  getCurrentInstance,
  inject,
  JSXNode,
  onMounted,
  onUnmounted,
  provide,
  useEffect,
  useSignal
} from '@viewfly/core'
import { useProduce, useStaticRef } from '@viewfly/hooks'
import { delay, fromEvent, Selection, Slot, Subscription, throttleTime } from '@textbus/core'
import { DomAdapter } from '@textbus/platform-browser'

import css from './left-toolbar.scoped.scss'
import { RefreshService } from '../../services/refresh.service'
import { LeftToolbarService } from '../../services/left-toolbar.service'
import { paragraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { sourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { blockquoteComponent } from '../../textbus/components/blockqoute/blockquote.component'
import { todolistComponent } from '../../textbus/components/todolist/todolist.component'
import { headingAttr } from '../../textbus/attributes/heading.attr'
import { MenuItem } from '../../components/menu-item/menu-item'
import { useActiveBlock } from '../hooks/active-block'
import { Divider } from '../../components/divider/divider'
import { useBlockTransform } from '../hooks/block-transform'

export function LeftToolbar() {
  provide(RefreshService)
  const adapter = inject(DomAdapter)
  const selection = inject(Selection)
  const leftToolbarService = inject(LeftToolbarService)
  const currentInstance = getCurrentInstance()
  const refreshService = currentInstance.get(RefreshService)

  const checkStates = useActiveBlock()
  const toBlock = useBlockTransform()
  const activeSlot = useSignal<Slot | null>(null)

  function transform(v: string) {
    const active = activeSlot()
    if (active) {
      selection.setPosition(active, active.length)
      toBlock(v)
      activeSlot.set(selection.focusSlot)
      refreshService.onRefresh.next()
    }
  }

  const [positionSignal, updatePosition] = useProduce({
    left: 0,
    top: 0,
    display: false
  })


  let timer: any = 0
  const subscription = leftToolbarService.onSlotActive.subscribe((c) => {
    activeSlot.set(c)
    const position = positionSignal()
    clearTimeout(timer)
    if (!c) {
      if (position.display) {
        timer = setTimeout(() => {
          updatePosition(draft => {
            draft.display = false
          })
        }, 200)
      }
      return
    }
    const nativeNode = adapter.getNativeNodeByComponent(c.parent!)!
    updatePosition(draft => {
      draft.display = true
      draft.left = nativeNode.offsetLeft
      draft.top = nativeNode.offsetTop
    })
  })

  subscription.add(selection.onChange.pipe(throttleTime(30)).subscribe(() => {
    leftToolbarService.onRefresh.next()
  }))

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const toolbarRef = useStaticRef<HTMLElement>()
  const menuRef = useStaticRef<HTMLElement>()
  const btnRef = useStaticRef<HTMLElement>()
  const isShow = useSignal(false)

  function updateMenuHeight() {
    const menuEle = menuRef.current!
    const btnEle = btnRef.current!
    const screenHeight = document.documentElement.clientHeight
    const menuHeight = Math.max(menuEle.offsetHeight, menuEle.scrollHeight)
    const maxHeight = Math.min(screenHeight - 20, menuHeight)

    menuEle.style.maxHeight = maxHeight + 'px'
    const btnRect = btnEle.getBoundingClientRect()

    const bottomHeight = screenHeight - 10 - btnRect.top - btnRect.height
    let offsetTop = maxHeight - bottomHeight
    if (bottomHeight > maxHeight) {
      offsetTop = 0
      if (btnRect.top < 10) {
        offsetTop = -(10 - btnRect.top)
      }
    }
    menuEle.style.top = -offsetTop + 'px'
  }

  useEffect(isShow, (newValue) => {
    if (newValue && menuRef.current) {
      updateMenuHeight()
    }
  })

  onMounted(() => {
    let leaveSub: Subscription
    const bindLeave = function () {
      leaveSub = fromEvent(toolbarRef.current!, 'mouseleave').pipe(delay(200)).subscribe(() => {
        isShow.set(false)
      })
    }
    bindLeave()
    subscription.add(
      fromEvent(toolbarRef.current!, 'mouseenter').subscribe(() => {
        if (leaveSub) {
          leaveSub.unsubscribe()
        }
        bindLeave()
        isShow.set(true)
      })
    )
  })


  const isEmptyBlock = useSignal(true)

  return withScopedCSS(css, () => {
    const position = positionSignal()
    const slot = activeSlot()
    let activeNode = <span class="xnote-icon-pilcrow"/>
    if (slot) {
      const component = slot.parent!
      const types: [boolean, JSXNode][] = [
        [component.name === paragraphComponent.name, <span class="xnote-icon-pilcrow"/>],
        [component.name === sourceCodeComponent.name, <span class="xnote-icon-source-code"/>],
        [component.name === blockquoteComponent.name, <span class="xnote-icon-quotes-right"/>],
        [component.name === todolistComponent.name, <span class="xnote-icon-checkbox-checked"/>],
      ]
      const heading = slot.getAttribute(headingAttr)
      if (heading) {
        types.unshift(
          ['h1' === heading, <span class="xnote-icon-heading-h1"/>],
          ['h2' === heading, <span class="xnote-icon-heading-h2"/>],
          ['h3' === heading, <span class="xnote-icon-heading-h3"/>],
          ['h4' === heading, <span class="xnote-icon-heading-h4"/>],
          ['h5' === heading, <span class="xnote-icon-heading-h5"/>],
          ['h6' === heading, <span class="xnote-icon-heading-h6"/>],
        )
      }

      for (const t of types) {
        if (t[0]) {
          activeNode = t[1]
          break
        }
      }
    }

    const states = checkStates()

    return (
      <div class="left-toolbar" ref={toolbarRef}>
        <div class="left-toolbar-btn-wrap" ref={btnRef} style={{
          left: position.left + 'px',
          top: position.top + 'px',
          display: position.display ? 'block' : 'none'
        }}>
          <button type="button" class="left-toolbar-btn">
            {
              isEmptyBlock() ?
                <span>
                  {
                    activeNode
                  }
                  <i style="font-size: 12px" class="xnote-icon-more"></i>
                </span>
                :
                <span>
                  <i class="bi bi-plus"></i>
                </span>
            }
          </button>
          <div class={[
            'left-toolbar-menu',
            {
              active: isShow()
            }
          ]} ref={menuRef}>
            <div class="left-toolbar-menu-items">

              <MenuItem onClick={transform} value="paragraph" icon={<span class="xnote-icon-pilcrow"/>}
                        checked={states.paragraph}>正文</MenuItem>
              <MenuItem onClick={transform} value="h1" icon={<span class="xnote-icon-heading-h1"/>} checked={states.h1}>一级标题</MenuItem>
              <MenuItem onClick={transform} value="h2" icon={<span class="xnote-icon-heading-h2"/>} checked={states.h2}>二级标题</MenuItem>
              <MenuItem onClick={transform} value="h3" icon={<span class="xnote-icon-heading-h3"/>} checked={states.h3}>三级标题</MenuItem>
              <MenuItem onClick={transform} value="h4" icon={<span class="xnote-icon-heading-h4"/>} checked={states.h4}>四级标题</MenuItem>
              <MenuItem onClick={transform} value="h5" icon={<span class="xnote-icon-heading-h5"/>} checked={states.h5}>五级标题</MenuItem>
              <MenuItem onClick={transform} value="h6" icon={<span class="xnote-icon-heading-h6"/>} checked={states.h6}>六级标题</MenuItem>
              <Divider/>
              <MenuItem onClick={transform} value="todolist" icon={<span class="xnote-icon-checkbox-checked"/>}
                        checked={states.todolist}>待办事项</MenuItem>
              <MenuItem onClick={transform} value="h2" icon={<span class="xnote-icon-list-numbered"></span>}>有序列表</MenuItem>
              <MenuItem onClick={transform} value="h2" icon={<span class="xnote-icon-list"/>}> 无序列表</MenuItem>
              <MenuItem onClick={transform} value="blockquote" icon={<span class="xnote-icon-quotes-right"/>}
                        checked={states.blockquote}>引用</MenuItem>
              <MenuItem onClick={transform} value="sourceCode" icon={<span class="xnote-icon-source-code"/>}
                        checked={states.sourceCode}>代码块</MenuItem>
            </div>
          </div>
        </div>
      </div>
    )
  })
}
