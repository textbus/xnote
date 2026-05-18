import { createRef, createSignal, inject, JSX, onMounted, onUnmounted, reactive, withAnnotation, } from '@viewfly/core'
import {
  Commander, Component,
  ContentType,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  fromEvent,
  merge,
  Observable,
  Operator,
  RootComponentRef,
  sampleTime,
  Selection,
  Subscription,
  Textbus,
} from '@textbus/core'
import { DomAdapter, VIEW_DOCUMENT } from '@textbus/platform-browser'
import { Button, Divider, Dropdown, MenuItem, MenuList } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import './left-toolbar.scss'
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
import { I18nService } from '../../services/i18n.service'
import { useBlockInsert } from '../hooks/block-insert'

export function raduce<T, U>(fn: (prev: U, current: T) => U, initValue: U): Operator<T, U> {
  return function (source: Observable<T>) {
    let prevValue = initValue
    return new Observable<U>(subscriber => {
      return source.subscribe({
        next(value) {
          prevValue = fn(prevValue, value)
          subscriber.next(prevValue)
        },
        error(err) {
          subscriber.error(err)
        },
        complete() {
          subscriber.complete()
        }
      })
    })
  }
}

export const LeftToolbar = withAnnotation({
  providers: [RefreshService, ToolService]
}, function LeftToolbar() {
  const adapter = inject(DomAdapter)
  const textbus = inject(Textbus)
  const selection = inject(Selection)
  const rootComponentRef = inject(RootComponentRef)
  const refreshService = inject(RefreshService)
  const editorService = inject(EditorService)
  const i18n = inject(I18nService)

  const checkStates = useActiveBlock()
  const toBlock = useBlockTransform()
  const insertBlock = useBlockInsert()
  const activeComponent = createSignal<Component<any> | null>(null)

  function transform(v: string) {
    const active = activeComponent()
    if (active) {
      selection.selectChildSlots(active)
      selection.restore()
      if (active === rootComponentRef.component) {
        insertBlock(v)
      } else {
        toBlock(v)
      }
      activeComponent.set(selection.commonAncestorComponent)
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
      raduce((prev, ev) => {
        let currentNode = ev.target as Node | null
        if (currentNode) {
          const slot = adapter.getSlotByNativeNode(currentNode as HTMLElement)
          if (slot?.parent instanceof TableComponent) {
            return prev
          }
        }
        while (currentNode) {
          const component = adapter.getComponentByNativeNode(currentNode as HTMLElement)
          if (component) {
            if (component.type === ContentType.InlineComponent) {
              currentNode = currentNode.parentNode
              continue
            }
            return component
          }
          currentNode = currentNode.parentNode
        }
        return null
      }, null as null | Component<any>),
      distinctUntilChanged(),
      sampleTime(250),
      filter(() => {
        return !isShow
      })
    ).subscribe(comp => {
      activeComponent.set(comp)
      if (comp) {
        isEmptyBlock.set(
          (comp instanceof ParagraphComponent && comp.state.slot.isEmpty) ||
          comp instanceof SourceCodeComponent ||
          comp instanceof TableComponent ||
          comp instanceof RootComponent
        )
        const nativeNode = adapter.getNativeNodeByComponent(comp)!
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
    if (activeComponent()) {
      return
    }
    refreshService.onRefresh.next()
  })

  onUnmounted(() => {
    subscription.unsubscribe()
  })

  const toolbarRef = createRef<HTMLDivElement>()
  let isShow = false

  onMounted(() => {
    let leaveSub: Subscription
    const bindLeave = function () {
      leaveSub = fromEvent(toolbarRef.value!, 'mouseleave').pipe(delay(200)).subscribe(() => {
        isShow = false
      })
    }
    bindLeave()
    subscription.add(
      fromEvent(toolbarRef.value!, 'mouseenter').subscribe(() => {
        if (leaveSub) {
          leaveSub.unsubscribe()
        }
        bindLeave()
        isShow = true
      })
    )
  })

  function applyBefore() {
    const component = activeComponent()
    if (component) {
      selection.selectChildSlots(component)
      textbus.nextTick(() => {
        refreshService.onRefresh.next()
      })
    }
  }

  const commander = inject(Commander)

  function copy() {
    const component = activeComponent()
    if (!component) {
      return
    }
    selection.selectComponent(component, true)
    commander.copy()
  }

  function cut() {
    const component = activeComponent()
    if (!component) {
      return
    }
    copy()
    remove()
  }


  function remove() {
    const component = activeComponent()
    if (!component) {
      return
    }
    if (component.slots.length <= 1) {
      commander.removeComponent(component)
    } else {
      selection.selectChildSlots(component)
      commander.delete()
    }
  }

  const isEmptyBlock = createSignal(true)

  function changeIgnoreMove(b: boolean) {
    isIgnoreMove = b
  }

  const btnRef = createRef<HTMLDivElement>()
  const dragLineRef = createRef<HTMLDivElement>()

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
    const sub = fromEvent<MouseEvent>(btnRef.value!, 'mousedown').subscribe((ev) => {
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
          const component = activeComponent()
          if (!component) {
            return
          }

          originComponent = component
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
          dragLineRef.value!.style.cssText = ''
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
        dragLineRef.value!.style.cssText = `left: ${left + 10}px; top: ${top}px; width: ${targetRect.width}px`
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
        dragLineRef.value!.style.cssText = ''
        selection.unSelect()
      })
    })

    return () => {
      sub.unsubscribe()
    }
  })

  const btnAvailable = createSignal(true)

  onMounted(() => {
    const unbind = fromEvent(container, 'mousedown').subscribe(() => {
      btnAvailable.set(false)
    })
    unbind.add(fromEvent(container, 'mouseup').subscribe(() => {
      btnAvailable.set(true)
    }))

    return () => {
      unbind.unsubscribe()
    }
  })

  return () => {
    const component = activeComponent()
    let activeNode = <IconGlyph name={'pilcrow'}/>
    const states = checkStates(component)

    if (component) {
      const types: [boolean, JSX.Element][] = [
        [states.paragraph, <IconGlyph name={'pilcrow'}/>],
        [states.sourceCode, <IconGlyph name={'source-code'}/>],
        [states.blockquote, <IconGlyph name={'quotes-right'}/>],
        [states.todolist, <IconGlyph name={'checkbox-checked'}/>],
        [states.unorderedList, <IconGlyph name={'list'}/>],
        [states.orderedList, <IconGlyph name={'list-numbered'}/>],
        [states.table, <IconGlyph name={'table'}/>],
        [states.h1, <IconGlyph name={'heading-h1'}/>],
        [states.h2, <IconGlyph name={'heading-h2'}/>],
        [states.h3, <IconGlyph name={'heading-h3'}/>],
        [states.h4, <IconGlyph name={'heading-h4'}/>],
        [states.h5, <IconGlyph name={'heading-h5'}/>],
        [states.h6, <IconGlyph name={'heading-h6'}/>],
      ]

      for (const t of types) {
        if (t[0]) {
          activeNode = t[1]
          break
        }
      }
    }

    const activeParentComponent = activeComponent()?.parent
    const needInsert = activeParentComponent instanceof TableComponent || activeParentComponent instanceof SourceCodeComponent
    return (
      <div class={['xnote-left-toolbar', {
        'xnote-left-toolbar--no-respond': !btnAvailable()
      }]} ref={toolbarRef}>
        <div class="xnote-left-toolbar-drag-line" ref={dragLineRef}></div>
        <div class="xnote-left-toolbar-panel" ref={btnRef} style={{
          left: positionSignal.left + 'px',
          top: positionSignal.top + 'px',
          display: positionSignal.display && editorService.canShowLeftToolbar ? 'block' : 'none'
        }}>
          <div class="xnote-anchor-tr">
            <Dropdown
              verticalPanelAlign={'left'}
              onOpenChange={changeIgnoreMove}
              getHorizontalTopMinFrom={() => {
                return container
              }}
              orientation={'horizontal'}
              horizontalPanelAlign={'middle'}
              trigger={'hover'}
              dropdown={
                isEmptyBlock() ?
                  <InsertMenu replace={!needInsert} component={activeComponent()}/>
                  :
                  <div class="xnote-w-menu-45">
                    <div class="xnote-toolbar-tools-wrap">
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
                        component={component}
                        applyBefore={applyBefore}>
                        <MenuItem chevronRight={true} density={'compact'}
                                  icon={<IconGlyph name={'indent-decrease'}/>}>{i18n.t('toolbar.indentAlign')}</MenuItem>
                      </AttrTool>
                      <TextColorTool
                        inLeftTool={true}
                        applyBefore={applyBefore}>
                        <MenuItem chevronRight={true} density={'compact'}
                                  icon={<IconGlyph name={'color'}/>}>{i18n.t('toolbar.textColor')}</MenuItem>
                      </TextColorTool>
                      <TextBackgroundColorTool
                        inLeftTool={true}
                        applyBefore={applyBefore}>
                        <MenuItem density={'compact'}
                                  chevronRight={true}
                                  icon={<IconGlyph name={'background-color'}/>}>{i18n.t('toolbar.textBackground')}</MenuItem>
                      </TextBackgroundColorTool>
                    </MenuList>
                    <Divider spacing={'compact'}/>
                    <MenuList columnCompact={true}>
                      <MenuItem density={'compact'} onClick={copy} icon={<IconGlyph name={'copy'}/>}>{i18n.t('toolbar.copy')}</MenuItem>
                      <MenuItem density={'compact'} onClick={remove} icon={<IconGlyph name={'bin'}/>}>{i18n.t('toolbar.delete')}</MenuItem>
                      <MenuItem density={'compact'} onClick={cut} icon={<IconGlyph name={'cut'}/>}>{i18n.t('toolbar.cut')}</MenuItem>
                    </MenuList>
                    <Divider spacing={'compact'}/>
                    <Dropdown block={true}
                              orientation={'horizontal'}
                              trigger={'hover'}
                              dropdown={<InsertMenu hideTitle={true} component={activeComponent()}/>}>
                      <MenuItem density={'compact'} chevronRight={true}
                                icon={<IconGlyph name={'plus'}/>}>{i18n.t('toolbar.addBelow')}</MenuItem>
                    </Dropdown>
                  </div>
              }>
              <Button size={'small'} inlineCompact={true} class="xnote-toolbar-compact-btn" chevronDown={false}>
                {
                  isEmptyBlock() ?
                    <span>
                    <IconGlyph name={'plus'}/>
                  </span>
                    :
                    <span class="xnote-toolbar-label-inline">
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
})
