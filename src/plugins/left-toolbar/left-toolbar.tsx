import { withScopedCSS } from '@viewfly/scoped-css'
import {
  createRef,
  createSignal,
  getCurrentInstance,
  inject,
  JSXNode,
  onMounted,
  onUnmounted,
  watch, withAnnotation,
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
import { MenuItem } from '../../components/menu-item/menu-item'
import { useActiveBlock } from '../hooks/active-block'
import { Divider } from '../../components/divider/divider'
import { useBlockTransform } from '../hooks/block-transform'
import { SourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { RootComponent } from '../../textbus/components/root/root.component'
import { Dropdown } from '../../components/dropdown/dropdown'
import { TableComponent } from '../../textbus/components/table/table.component'
import { ParagraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { Button } from '../../components/button/button'
import { AttrTool } from '../_common/attr-tool'
import { ColorTool } from '../_common/color.tool'

export const LeftToolbar = withAnnotation({
  providers: [RefreshService]
}, function LeftToolbar() {
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
      selection.setBaseAndExtent(active, 0, active, active.length)
      selection.restore()
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
        checkStates(slot)
        isEmptyBlock.set(slot.parent instanceof ParagraphComponent && slot.isEmpty)
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
        isEmptyBlock.set(false)
      }
    })

    return () => sub.unsubscribe()
  })
  const subscription = merge(textbus.onChange, selection.onChange).pipe(
    debounceTime(20)
  ).subscribe(() => {
    if (activeSlot()) {
      return
    }
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
    const states = checkStates()

    if (slot) {
      const types: [boolean, JSXNode][] = [
        [states.paragraph, <span class="xnote-icon-pilcrow"/>],
        [states.sourceCode, <span class="xnote-icon-source-code"/>],
        [states.blockquote, <span class="xnote-icon-quotes-right"/>],
        [states.todolist, <span class="xnote-icon-checkbox-checked"/>],
        [states.table, <span class="xnote-icon-table"/>],
        [states.unorderedList, <span class="xnote-icon-list"/>],
        [states.orderedList, <span class="xnote-icon-list-numbered"/>],
        [states.h1, <span class="xnote-icon-heading-h1"/>],
        [states.h2, <span class="xnote-icon-heading-h2"/>],
        [states.h3, <span class="xnote-icon-heading-h3"/>],
        [states.h4, <span class="xnote-icon-heading-h4"/>],
        [states.h5, <span class="xnote-icon-heading-h5"/>],
        [states.h6, <span class="xnote-icon-heading-h6"/>],
      ]

      for (const t of types) {
        if (t[0]) {
          activeNode = t[1]
          break
        }
      }
    }

    return (
      <div class="left-toolbar" ref={toolbarRef}>
        <div class="left-toolbar-btn-wrap" ref={btnRef} style={{
          left: position.left + 'px',
          top: position.top + 'px',
          display: position.display && selection.isCollapsed ? 'block' : 'none'
        }}>
          <Dropdown abreast={true} style={{
            position: 'absolute',
            right: 0,
            top: 0
          }} menu={
            <>
              <div class="btn-group">
                <Button ordinary={true} highlight={states.paragraph} onClick={() => transform('paragraph')}>
                  <span class="xnote-icon-pilcrow"/>
                </Button>
                <Button ordinary={true} highlight={states.h1} onClick={() => transform('h1')}>
                  <span class="xnote-icon-heading-h1"/>
                </Button>
                <Button ordinary={true} highlight={states.h2} onClick={() => transform('h2')}>
                  <span class="xnote-icon-heading-h2"/>
                </Button>
                <Button ordinary={true} highlight={states.h3} onClick={() => transform('h3')}>
                  <span class="xnote-icon-heading-h3"/>
                </Button>
                <Button ordinary={true} highlight={states.h4} onClick={() => transform('h4')}>
                  <span class="xnote-icon-heading-h4"/>
                </Button>
                <Button ordinary={true} highlight={states.todolist} onClick={() => transform('todolist')}>
                  <span class="xnote-icon-checkbox-checked"/>
                </Button>
                <Button ordinary={true} highlight={states.orderedList} onClick={() => transform('ol')}>
                  <span class="xnote-icon-list-numbered"/>
                </Button>
                <Button ordinary={true} highlight={states.unorderedList} onClick={() => transform('ul')}>
                  <span class="xnote-icon-list"/>
                </Button>
                <Button ordinary={true} highlight={states.blockquote} onClick={() => transform('blockquote')}>
                  <span class="xnote-icon-quotes-right"/>
                </Button>
                <Button ordinary={true} highlight={states.sourceCode} onClick={() => transform('sourceCode')}>
                  <span class="xnote-icon-source-code"/>
                </Button>
              </div>
              <Divider/>
              <AttrTool style={{ display: 'block' }} abreast={true}>
                <MenuItem arrow={true} icon={<span class="xnote-icon-indent-decrease"/>}>缩进和对齐</MenuItem>
              </AttrTool>
              <ColorTool style={{ display: 'block' }} abreast={true}>
                <MenuItem arrow={true} icon={<span class="xnote-icon-color"/>}>颜色</MenuItem>
              </ColorTool>
              <Divider/>
              <MenuItem icon={<span class="xnote-icon-copy"/>}>复制</MenuItem>
              <MenuItem icon={<span class="xnote-icon-bin"/>}>删除</MenuItem>
              <MenuItem icon={<span class="xnote-icon-cut"/>}>剪切</MenuItem>
              <Divider/>
              <Dropdown style={{ display: 'block' }} abreast={true} menu={
                <>
                  <MenuItem onClick={transform} value="table" icon={<span class="xnote-icon-table"/>} checked={states.table}>表格</MenuItem>
                </>
              }>
                <MenuItem arrow={true} icon={<span class="xnote-icon-plus"/>}>在下面添加</MenuItem>
              </Dropdown>
            </>
          }>
            <button type="button" class="left-toolbar-btn">
              {
                isEmptyBlock() ?
                  <span>
                    <i class="xnote-icon-plus"></i>
                  </span>
                  :
                  <span>
                    {
                      activeNode
                    }
                    <i style="font-size: 12px" class="xnote-icon-more"></i>
                  </span>
              }
            </button>
          </Dropdown>
        </div>
      </div>
    )
  })
})
