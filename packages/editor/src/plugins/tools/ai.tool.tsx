import { createRef, getCurrentInstance, inject, onUnmounted, reactive } from '@viewfly/core'
import { Parser, VIEW_DOCUMENT } from '@textbus/platform-browser'
import { Commander, ContentType, distinctUntilChanged, map, Selection, Slot, Subscription } from '@textbus/core'
import { IconGlyph } from '@viewfly/ui-icons'
import MarkdownIt from 'markdown-it'
import { Button, Divider, Dropdown, MenuItem, MenuList, Popover } from '@viewfly/ui-components'

import { EditorService } from '../../services/editor.service'
import { useCommonState } from './_common/common-state'
import { LLMService } from '../../services/llm.service'
import { usePopupPosition } from '../hooks/popup-position'
import { RefreshService } from '../../services/refresh.service'

export interface AiToolProps {
  hideToolbar?(): void
}

const translationLanguages = [
  '中文',
  'English',
  'Español',
  'Português',
  'Français',
  'Deutsch',
  'Italiano',
  'Русский',
  'العربية',
  'हिन्दी',
  'বাংলা',
  '日本語',
  '한국어',
  'Türkçe'
] as const

export function AiTool(props: AiToolProps) {
  const llmService = inject(LLMService)
  const selection = inject(Selection)
  const commander = inject(Commander)
  const editorService = inject(EditorService)
  const refreshService = inject(RefreshService)

  const instance = getCurrentInstance()

  const sub = new Subscription()

  sub.add(refreshService.onRefresh.pipe(
    map(() => {
      return selection.isCollapsed
    }),
    distinctUntilChanged()
  ).subscribe(() => {
    instance.markAsDirtied()
  }))

  onUnmounted(() => {
    sub.unsubscribe()
  })

  const viewModel = reactive({
    showModal: false,
    dropdownOpen: false,
    content: '',
    type: 'translate' as keyof LLMService
  })

  let subscription = new Subscription()

  function continueContent() {
    viewModel.type = 'continue'
    viewModel.content = ''
    props.hideToolbar?.()
    viewModel.showModal = true
    viewModel.dropdownOpen = false
    subscription.unsubscribe()
    subscription = llmService.continue({
      text: document.getSelection()!.toString()
    }).subscribe((text) => {
      viewModel.content += text
    })
  }

  function polish() {
    viewModel.type = 'polish'
    viewModel.content = ''
    props.hideToolbar?.()
    viewModel.showModal = true
    viewModel.dropdownOpen = false
    subscription.unsubscribe()
    subscription = llmService.polish({
      text: document.getSelection()!.toString()
    }).subscribe((text) => {
      viewModel.content += text
    })
  }


  function simplify() {
    viewModel.type = 'simplify'
    viewModel.content = ''
    props.hideToolbar?.()
    viewModel.showModal = true
    viewModel.dropdownOpen = false
    subscription.unsubscribe()
    subscription = llmService.simplify({
      text: document.getSelection()!.toString()
    }).subscribe((text) => {
      viewModel.content += text
    })
  }

  function enrich() {
    viewModel.type = 'enrich'
    viewModel.content = ''
    props.hideToolbar?.()
    viewModel.showModal = true
    viewModel.dropdownOpen = false
    subscription.unsubscribe()
    subscription = llmService.enrich({
      text: document.getSelection()!.toString()
    }).subscribe((text) => {
      viewModel.content += text
    })
  }

  function translate(lang: string) {
    viewModel.type = 'translate'
    viewModel.content = ''
    props.hideToolbar?.()
    viewModel.showModal = true
    viewModel.dropdownOpen = false
    subscription.unsubscribe()
    subscription = llmService.translate({
      text: document.getSelection()!.toString(),
      targetLanguage: lang
    }).subscribe((text) => {
      viewModel.content += text
    })
  }


  function summarize() {
    viewModel.type = 'summarize'
    viewModel.content = ''
    props.hideToolbar?.()
    viewModel.showModal = true
    viewModel.dropdownOpen = false
    subscription.unsubscribe()
    subscription = llmService.summarize({
      text: document.getSelection()!.toString(),
    }).subscribe((text) => {
      viewModel.content += text
    })
  }

  const aiContentRef = createRef<HTMLDivElement>()
  const parser = inject(Parser)

  function insert() {
    selection.collapse()
    aiContentRef.value!.childNodes.forEach(node => {
      const slot = parser.parse(node instanceof HTMLElement ? node : node.textContent || '', new Slot([
        ContentType.BlockComponent,
        ContentType.InlineComponent,
        ContentType.Text
      ]))

      commander.paste(slot, aiContentRef.value!.innerText)
    })

    viewModel.showModal = false
    props.hideToolbar?.()
  }

  function replace() {
    if (!selection.isCollapsed) {
      commander.delete()
    }
    insert()
    props.hideToolbar?.()
  }

  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true
  })

  function renderMarkdown(markdown: string) {
    const html = md.render(markdown)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    function parseNode(node: Node): any {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const TagName = element.tagName.toLowerCase()
        const children = Array.from(element.childNodes).map(parseNode)
        const props: any = {}

        if (element.className) {
          props.class = element.className
        }

        switch (TagName) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
          case 'p':
          case 'strong':
          case 'em':
          case 'code':
          case 'pre':
          case 'blockquote':
          case 'ul':
          case 'ol':
          case 'li':
          case 'span':
          case 'div':
            return <TagName {...props}>{children}</TagName>
          case 'br':
            return <br/>
          case 'a':
            props.href = element.getAttribute('href') || ''
            return <a {...props}>{children}</a>
          case 'img':
            props.src = element.getAttribute('src') || ''
            props.alt = element.getAttribute('alt') || ''
            return <img {...props} />
          case 'hr':
            return <hr/>
          default:
            return <span {...props}>{children}</span>
        }
      }

      return null
    }

    return Array.from(tempDiv.childNodes).map(parseNode)
  }

  const commonState = useCommonState()

  const popupPosition = usePopupPosition()

  const viewDocument = inject(VIEW_DOCUMENT)

  function getContainer() {
    return viewDocument
  }

  return () => {
    const b = commonState().inSourceCode || commonState().readonly || selection.isCollapsed
    return (
      <>
        <Dropdown trigger={'hover'} menuColumnCompact={true} disabled={b} dropdown={
          <MenuList class={'w-36'}>
            <MenuItem density={'compact'} icon={<IconGlyph name={'continuation'}/>} onClick={continueContent}>续写</MenuItem>
            <MenuItem density={'compact'} icon={<IconGlyph name={'magic-wand'}/>} onClick={polish}>润色</MenuItem>
            <MenuItem density={'compact'} icon={<IconGlyph name={'simplify'}/>} onClick={simplify}>简化内容</MenuItem>
            <MenuItem density={'compact'} icon={<IconGlyph name={'enrich'}/>} onClick={enrich}>丰富内容</MenuItem>
            <Divider spacing={'compact'}/>
            <Dropdown trigger={'hover'} block orientation={'horizontal'} horizontalAlign={'right'} dropdown={
              <MenuList>
                {translationLanguages.map((lang) => {
                  return <MenuItem density={'compact'} key={lang} onClick={() => translate(lang)}>{lang}</MenuItem>
                })}
              </MenuList>
            }>
              <MenuItem density={'compact'} chevronRight={true} icon={<IconGlyph name={'translation'}/>}>翻译</MenuItem>
            </Dropdown>
            <MenuItem density={'compact'} icon={<IconGlyph name={'summary'}/>} onClick={summarize}>总结</MenuItem>
          </MenuList>
        }>
          <Button size={'small'} inlineCompact={true} chevronGapless={true} variant={'text'} disabled={b}>
            <IconGlyph name={'ai'}/>
          </Button>
        </Dropdown>
        {
          <Popover getContainer={getContainer}
                   open={viewModel.showModal}
                   showArrow={false}
                   noPadding={true}
                   onOpenChange={(open) => {
                     viewModel.showModal = open
                   }}
                   getReferenceBox={() => {
                     return popupPosition()!
                   }} content={
            <div class="w-100 h-50 flex flex-col">
              <div class="flex-1 overflow-y-auto p-2" ref={aiContentRef}>
                {renderMarkdown(viewModel.content)}
              </div>
              <Divider spacing={'none'}/>
              <div class="flex justify-end gap-2 p-2">
                <Button size={'small'} htmlType="button" onClick={replace}>替换</Button>
                <Button size={'small'} htmlType="button" onClick={insert}>插入</Button>
              </div>
            </div>
          }/>
        }
      </>
    )
  }
}
