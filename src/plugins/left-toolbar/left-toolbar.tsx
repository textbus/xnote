import { withScopedCSS } from '@viewfly/scoped-css'
import {
  createRef,
  createSignal,
  getCurrentInstance,
  inject,
  JSXNode,
  onMounted,
  onUnmounted,
  provide, watch,
} from '@viewfly/core'
import { useProduce } from '@viewfly/hooks'
import {
  debounceTime,
  delay,
  distinctUntilChanged, filter,
  fromEvent,
  map, merge,
  RootComponentRef, sampleTime,
  Selection,
  Slot,
  Subscription, Textbus,
  throttleTime
} from '@textbus/core'
import { DomAdapter } from '@textbus/platform-browser'

import css from './left-toolbar.scoped.scss'
import { RefreshService } from '../../services/refresh.service'
import { headingAttr } from '../../textbus/attributes/heading.attr'
import { MenuItem } from '../../components/menu-item/menu-item'
import { useActiveBlock } from '../hooks/active-block'
import { Divider } from '../../components/divider/divider'
import { useBlockTransform } from '../hooks/block-transform'
import { ParagraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { SourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { BlockquoteComponent } from '../../textbus/components/blockqoute/blockquote.component'
import { TodolistComponent } from '../../textbus/components/todolist/todolist.component'
import { RootComponent } from '../../textbus/components/root/root.component'
import { Dropdown } from '../../components/dropdown/dropdown'
import { TableComponent } from '../../textbus/components/table/table.component'

export function LeftToolbar() {
  provide(RefreshService)
  const adapter = inject(DomAdapter)
  const textbus = inject(Textbus)
  const selection = inject(Selection)
  const rootComponentRef = inject(RootComponentRef)
  const currentInstance = getCurrentInstance()
  const refreshService = currentInstance.get(RefreshService)

  const checkStates = useActiveBlock()
  const toBlock = useBlockTransform()
  const activeSlot = createSignal<Slot | null>(null)

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

  onMounted(() => {
    const rootComponent = rootComponentRef.component as RootComponent
    const docContentContainer = adapter.getNativeNodeBySlot(rootComponent.state.content)!
    const sub = fromEvent(docContentContainer!, 'mousemove').pipe(
      filter(() => {
        return selection.isCollapsed
      }),
      map(ev => {
        let currentNode = ev.target as Node | null
        while (currentNode) {
          const slot = adapter.getSlotByNativeNode(currentNode as HTMLElement)
          if (slot) {
            if (slot?.parent instanceof SourceCodeComponent || slot?.parent instanceof TableComponent) {
              return null
            }
            return slot
          }
          currentNode = currentNode.parentNode
        }
        return null
      }),
      distinctUntilChanged(),
      filter(slot => {
        return !slot || slot !== rootComponent.state.content
      }),
      sampleTime(250),
      filter(() => {
        return !isShow()
      })
    ).subscribe(slot => {
      activeSlot.set(slot)
      if (slot) {
        const nativeNode = adapter.getNativeNodeByComponent(slot.parent!)!
        updatePosition(draft => {
          const containerRect = docContentContainer.getBoundingClientRect()
          const currentRect = nativeNode.getBoundingClientRect()
          draft.display = true
          draft.left = currentRect.left - containerRect.left
          draft.top = currentRect.top - containerRect.top + docContentContainer.offsetTop
        })
      } else {
        updatePosition(draft => {
          draft.display = false
        })
      }
    })

    return () => sub.unsubscribe()
  })
  const subscription = merge(textbus.onChange, selection.onChange).pipe(
    debounceTime(20)
  ).subscribe(() => {
    refreshService.onRefresh.next()
  }).add(
    selection.onChange.pipe(throttleTime(30)).subscribe(() => {
      if (!selection.isCollapsed) {
        updatePosition(draft => {
          draft.display = false
        })
      }
    })
  )

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const toolbarRef = createRef<HTMLElement>()
  const menuRef = createRef<HTMLElement>()
  const btnRef = createRef<HTMLElement>()
  const isShow = createSignal(false)

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

  watch(isShow, (newValue) => {
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


  const isEmptyBlock = createSignal(true)

  return withScopedCSS(css, () => {
    const position = positionSignal()
    const slot = activeSlot()
    let activeNode = <span class="xnote-icon-pilcrow"/>
    if (slot) {
      const component = slot.parent!
      const types: [boolean, JSXNode][] = [
        [component.name === ParagraphComponent.componentName, <span class="xnote-icon-pilcrow"/>],
        [component.name === SourceCodeComponent.componentName, <span class="xnote-icon-source-code"/>],
        [component.name === BlockquoteComponent.componentName, <span class="xnote-icon-quotes-right"/>],
        [component.name === TodolistComponent.componentName, <span class="xnote-icon-checkbox-checked"/>],
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

    const states = checkStates(activeSlot())

    return (
      <div class="left-toolbar" ref={toolbarRef}>
        <div class="left-toolbar-btn-wrap" ref={btnRef} style={{
          left: position.left + 'px',
          top: position.top + 'px',
          display: position.display ? 'block' : 'none'
        }}>
          <Dropdown abreast={true} style={{
            position: 'absolute',
            right: 0,
            top: 0
          }} menu={
            <>
              <MenuItem onClick={transform} value="paragraph" icon={<span class="xnote-icon-pilcrow"/>}
                        checked={states.paragraph}>正文</MenuItem>
              <MenuItem onClick={transform} value="h1" icon={<span class="xnote-icon-heading-h1"/>} checked={states.h1}>一级标题</MenuItem>
              <MenuItem onClick={transform} value="h2" icon={<span class="xnote-icon-heading-h2"/>} checked={states.h2}>二级标题</MenuItem>
              <MenuItem onClick={transform} value="h3" icon={<span class="xnote-icon-heading-h3"/>} checked={states.h3}>三级标题</MenuItem>
              <MenuItem onClick={transform} value="h4" icon={<span class="xnote-icon-heading-h4"/>} checked={states.h4}>四级标题</MenuItem>
              <MenuItem onClick={transform} value="h5" icon={<span class="xnote-icon-heading-h5"/>} checked={states.h5}>五级标题</MenuItem>
              <MenuItem onClick={transform} value="h6" icon={<span class="xnote-icon-heading-h6"/>} checked={states.h6}>六级标题</MenuItem>
              <Divider/>
              <MenuItem onClick={transform} value="table" icon={<span class="xnote-icon-table"/>} checked={states.table}>表格</MenuItem>
              <MenuItem onClick={transform} value="todolist" icon={<span class="xnote-icon-checkbox-checked"/>}
                        checked={states.todolist}>待办事项</MenuItem>
              <MenuItem onClick={transform} value="ol" icon={<span class="xnote-icon-list-numbered"></span>}
                        checked={states.orderedList}>有序列表</MenuItem>
              <MenuItem onClick={transform} value="ul" icon={<span class="xnote-icon-list"/>}
                        checked={states.unorderedList}>无序列表</MenuItem>
              <MenuItem onClick={transform} value="blockquote" icon={<span class="xnote-icon-quotes-right"/>}
                        checked={states.blockquote}>引用</MenuItem>
              <MenuItem onClick={transform} value="sourceCode" icon={<span class="xnote-icon-source-code"/>}
                        checked={states.sourceCode}>代码块</MenuItem>
            </>
          }>
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
          </Dropdown>
        </div>
      </div>
    )
  })
}
