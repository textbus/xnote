import { createRef, createSignal, inject, JSX, onMounted, onUnmounted, reactive, withAnnotation, withMark, } from '@viewfly/core'
import {
  Commander, Component,
  ContentType,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  RootComponentRef,
  sampleTime,
  Selection,
  Slot,
  Subscription,
  Textbus,
} from '@textbus/core'
import { DomAdapter, VIEW_DOCUMENT } from '@textbus/platform-browser'
import { Button, Divider, Dropdown, MenuItem, MenuList } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import css from './left-toolbar.scoped.scss'
import { RefreshService } from '../../services/refresh.service'
import { useActiveBlock } from '../hooks/active-block'
import { useBlockTransform } from '../hooks/block-transform'
import { SourceCodeComponent } from '../../textbus/components/source-code/source-code.component'
import { RootComponent } from '../../textbus/components/root/root.component'
import { TableComponent } from '../../textbus/components/table/table.component'
import { ParagraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { AttrTool } from '../tools/attr.tool'
import { InsertMenu } from '../tools/insert-menu'
import { EditorService } from '../../services/editor.service'
import { ToolService } from '../tools/_common/tool.service'
import { TextColorTool } from '../tools/text-color.tool'
import { TextBackgroundColorTool } from '../tools/text-background-color.tool'

export const LeftToolbar = withAnnotation({
  providers: [RefreshService, ToolService]
}, withMark(css, function LeftToolbar() {
  const adapter = inject(DomAdapter)
  const textbus = inject(Textbus)
  const selection = inject(Selection)
  const rootComponentRef = inject(RootComponentRef)
  const refreshService = inject(RefreshService)
  const editorService = inject(EditorService)

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

  const positionSignal = reactive({
    left: 0,
    top: 0,
    display: false
  })


  const sub = editorService.onLeftToolbarCanVisibleChange.subscribe(() => {
    positionSignal.display = editorService.canShowLeftToolbar
  })

  onUnmounted(() => {
    sub.unsubscribe()
  })

  let isIgnoreMove = false

  onMounted(() => {
    const rootComponent = rootComponentRef.component as RootComponent
    const docContentContainer = adapter.getNativeNodeBySlot(rootComponent.state.content)! as HTMLElement
    const sub = fromEvent(docContentContainer!, 'mousemove').pipe(
      filter(() => {
        return !isIgnoreMove
      }),
      map(ev => {
        let currentNode = ev.target as Node | null
        while (currentNode) {
          const slot = adapter.getSlotByNativeNode(currentNode as HTMLElement)
          if (slot) {
            if (slot?.parent?.type === ContentType.InlineComponent) {
              currentNode = currentNode.parentNode
              continue
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
        return !isShow
      })
    ).subscribe(slot => {
      activeSlot.set(slot)
      if (slot) {
        checkStates(slot)
        isEmptyBlock.set(
          (slot.parent instanceof ParagraphComponent && slot.isEmpty) ||
          slot.parent instanceof SourceCodeComponent ||
          slot.parent instanceof TableComponent
        )
        const nativeNode = adapter.getNativeNodeByComponent(slot.parent!)!
        const containerRect = docContentContainer.getBoundingClientRect()
        const currentRect = nativeNode.getBoundingClientRect()
        positionSignal.display = true
        positionSignal.left = currentRect.left - containerRect.left
        positionSignal.top = currentRect.top - containerRect.top + docContentContainer.offsetTop
      } else {
        positionSignal.display = false
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
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const toolbarRef = createRef<HTMLElement>()
  let isShow = false

  onMounted(() => {
    let leaveSub: Subscription
    const bindLeave = function () {
      leaveSub = fromEvent(toolbarRef.current!, 'mouseleave').pipe(delay(200)).subscribe(() => {
        isShow = false
      })
    }
    bindLeave()
    subscription.add(
      fromEvent(toolbarRef.current!, 'mouseenter').subscribe(() => {
        if (leaveSub) {
          leaveSub.unsubscribe()
        }
        bindLeave()
        isShow = true
      })
    )
  })

  function applyBefore() {
    const slot = activeSlot()
    if (slot) {
      selection.selectSlot(slot)
      textbus.nextTick(() => {
        refreshService.onRefresh.next()
      })
    }
  }

  const commander = inject(Commander)

  function copy() {
    const slot = activeSlot()
    if (!slot) {
      return
    }
    selection.selectComponent(slot.parent!, true)
    commander.copy()
  }

  function cut() {
    const slot = activeSlot()
    if (!slot) {
      return
    }
    copy()
    remove()
  }


  function remove() {
    const slot = activeSlot()
    if (!slot) {
      return
    }
    if (slot.parent!.slots.length <= 1) {
      commander.removeComponent(slot.parent!)
    } else {
      selection.selectSlot(slot)
      commander.delete()
    }
  }

  const isEmptyBlock = createSignal(true)

  function changeIgnoreMove(b: boolean) {
    isIgnoreMove = b
  }

  const btnRef = createRef<HTMLElement>()
  const dragLineRef = createRef<HTMLElement>()

  function findBlockComponentView(el: HTMLElement) {
    while (el) {
      const comp = adapter.getComponentByNativeNode(el)
      if (!comp || comp.type !== ContentType.BlockComponent) {
        el = el.parentElement!
        continue
      }
      if (comp instanceof RootComponent) {
        break
      }
      return {
        component: comp,
        view: el
      }
    }
    return null
  }

  const container = inject(VIEW_DOCUMENT)

  onMounted(() => {
    const sub = fromEvent<MouseEvent>(btnRef.current!, 'mousedown').subscribe((ev) => {
      isShow = false
      changeIgnoreMove(true)
      const startX = ev.clientX
      const startY = ev.clientY

      let cloneNode: HTMLElement | null = null
      const containerRect = container.getBoundingClientRect()
      let originComponent: Component<any> | null = null
      let originView: HTMLElement | null = null

      let targetComponent: Component<any> | null = null
      let isBefore = true
      const move = fromEvent<MouseEvent>(document, 'mousemove').subscribe((ev) => {
        editorService.changeLeftToolbarVisible(false)
        if (!cloneNode) {
          const slot = activeSlot()
          if (!slot) {
            return
          }

          originComponent = slot.parent
          const el = adapter.getNativeNodeByComponent(originComponent!) as HTMLElement
          originView = el
          originView.style.opacity = '0.5'
          originView.style.pointerEvents = 'none'
          const rect = el.getBoundingClientRect()

          cloneNode = el.cloneNode(true) as HTMLElement

          cloneNode.style.cssText = `position: fixed; left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px; box-shadow: 1px 2px 3px rgba(0,0,0,.1);background:#fff;pointer-events: none;user-select:none`
          document.body.appendChild(cloneNode)
        }
        cloneNode.style.transform = `translate(${ev.clientX - startX}px, ${ev.clientY - startY}px)`

        const findResult = findBlockComponentView(ev.target as HTMLElement)
        if (!findResult || findResult.component === originComponent) {
          dragLineRef.current!.style.cssText = ''
          targetComponent = null
          return
        }

        const targetRect = findResult.view.getBoundingClientRect()
        let top = targetRect.top - containerRect.top
        const left = targetRect.left - containerRect.left
        isBefore = true

        if (ev.clientY > targetRect.top + targetRect.height / 2) {
          top = top + targetRect.height
          isBefore = false
        }

        targetComponent = findResult.component
        dragLineRef.current!.style.cssText = `left: ${left + 10}px; top: ${top}px; width: ${targetRect.width}px`
      })

      const up = fromEvent(document, 'mouseup').subscribe(() => {
        move.unsubscribe()
        up.unsubscribe()
        if (cloneNode) {
          document.body.removeChild(cloneNode)
        }
        if (originView) {
          originView.style.opacity = ''
          originView.style.pointerEvents = ''
        }
        if (originComponent && targetComponent) {
          if (isBefore) {
            commander.insertBefore(originComponent, targetComponent)
          } else {
            commander.insertAfter(originComponent, targetComponent)
          }
        }
        editorService.changeLeftToolbarVisible(true)
        dragLineRef.current!.style.cssText = ''
        selection.unSelect()
      })
    })

    return () => {
      sub.unsubscribe()
    }
  })

  return () => {
    const slot = activeSlot()
    let activeNode = <IconGlyph name={'pilcrow'}/>
    const states = checkStates(slot)

    if (slot) {
      const types: [boolean, JSX.Element][] = [
        [states.paragraph, <span class="xnote-icon-pilcrow"/>],
        [states.sourceCode, <span class="xnote-icon-source-code"/>],
        [states.blockquote, <span class="xnote-icon-quotes-right"/>],
        [states.todolist, <span class="xnote-icon-checkbox-checked"/>],
        [states.unorderedList, <span class="xnote-icon-list"/>],
        [states.orderedList, <span class="xnote-icon-list-numbered"/>],
        [states.table, <span class="xnote-icon-table"/>],
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

    const activeParentComponent = activeSlot()?.parent
    const needInsert = activeParentComponent instanceof TableComponent || activeParentComponent instanceof SourceCodeComponent
    return (
      <div class="left-toolbar" ref={toolbarRef}>
        <div class="drag-line" ref={dragLineRef}></div>
        <div class="left-toolbar-btn-wrap" ref={btnRef} style={{
          left: positionSignal.left + 'px',
          top: positionSignal.top + 'px',
          display: positionSignal.display && editorService.canShowLeftToolbar ? 'block' : 'none'
        }}>
          <div class={'absolute right-0 top-0'}>
            <Dropdown
              verticalPanelAlign={'left'}
              onOpenChange={changeIgnoreMove}
              orientation={'horizontal'}
              horizontalPanelAlign={'middle'}
              trigger={'hover'}
              dropdown={
                isEmptyBlock() ?
                  <InsertMenu replace={!needInsert} slot={activeSlot()}/>
                  :
                  <div class={'w-45'}>
                    <div class="flex flex-wrap gap-1">
                      <Button variant={'text'} highlighted={states.paragraph} inlineCompact={true}
                              onClick={() => transform('paragraph')}>
                        <IconGlyph name={'pilcrow'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.h1} inlineCompact={true} onClick={() => transform('h1')}>
                        <IconGlyph name={'heading-h1'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.h2} inlineCompact={true} onClick={() => transform('h2')}>
                        <IconGlyph name={'heading-h2'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.h3} inlineCompact={true} onClick={() => transform('h3')}>
                        <IconGlyph name={'heading-h3'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.h4} inlineCompact={true} onClick={() => transform('h4')}>
                        <IconGlyph name={'heading-h4'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.todolist} inlineCompact={true}
                              onClick={() => transform('todolist')}>
                        <IconGlyph name={'checkbox-checked'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.orderedList} inlineCompact={true} onClick={() => transform('ol')}>
                        <IconGlyph name={'list-numbered'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.unorderedList} inlineCompact={true}
                              onClick={() => transform('ul')}>
                        <IconGlyph name={'list'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.blockquote} inlineCompact={true}
                              onClick={() => transform('blockquote')}>
                        <IconGlyph name={'quotes-right'}/>
                      </Button>
                      <Button variant={'text'} highlighted={states.sourceCode} inlineCompact={true}
                              onClick={() => transform('sourceCode')}>
                        <IconGlyph name={'source-code'}/>
                      </Button>
                    </div>
                    <Divider spacing={'compact'}/>
                    <MenuList columnCompact={true}>
                      <AttrTool
                        inLeftTool={true}
                        slot={slot}
                        applyBefore={applyBefore}>
                        <MenuItem chevronRight={true} density={'compact'}
                                  icon={<IconGlyph name={'indent-decrease'}/>}>缩进和对齐</MenuItem>
                      </AttrTool>
                      <TextColorTool
                        inLeftTool={true}
                        applyBefore={applyBefore}>
                        <MenuItem chevronRight={true} density={'compact'} icon={<IconGlyph name={'color'}/>}>文字颜色</MenuItem>
                      </TextColorTool>
                      <TextBackgroundColorTool
                        inLeftTool={true}
                        applyBefore={applyBefore}>
                        <MenuItem density={'compact'}
                                  chevronRight={true}
                                  icon={<IconGlyph name={'background-color'}/>}>文字背景颜色</MenuItem>
                      </TextBackgroundColorTool>
                    </MenuList>
                    <Divider spacing={'compact'}/>
                    <MenuList columnCompact={true}>
                      <MenuItem density={'compact'} onClick={copy} icon={<IconGlyph name={'copy'}/>}>复制</MenuItem>
                      <MenuItem density={'compact'} onClick={remove} icon={<IconGlyph name={'bin'}/>}>删除</MenuItem>
                      <MenuItem density={'compact'} onClick={cut} icon={<IconGlyph name={'cut'}/>}>剪切</MenuItem>
                    </MenuList>
                    <Divider spacing={'compact'}/>
                    <Dropdown block={true}
                              orientation={'horizontal'}
                              trigger={'hover'}
                              dropdown={<InsertMenu hideTitle={true} slot={activeSlot()}/>}>
                      <MenuItem density={'compact'} chevronRight={true} icon={<IconGlyph name={'plus'}/>}>在下面添加</MenuItem>
                    </Dropdown>
                  </div>
              }>
              <Button size={'small'} inlineCompact={true} class={'min-w-8 h-7'} chevronDown={false}>
                {
                  isEmptyBlock() ?
                    <span>
                    <IconGlyph name={'plus'}/>
                  </span>
                    :
                    <span class="inline-flex items-center">
                    {
                      activeNode
                    }
                      <IconGlyph name={'more'}/>
                  </span>
                }
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>
    )
  }
}))
