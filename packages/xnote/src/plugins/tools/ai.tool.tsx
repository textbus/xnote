import { createRef, getCurrentInstance, inject, onUnmounted, reactive } from '@viewfly/core'
import { Parser } from '@textbus/platform-browser'
import { withScopedCSS } from '@viewfly/scoped-css'
import { Commander, ContentType, distinctUntilChanged, fromEvent, map, Selection, Slot, Subscription } from '@textbus/core'
import MarkdownIt from 'markdown-it'

import css from './ai-tool.scoped.scss'
import { Popup } from '../../components/popup/popup'
import { Button } from '../../components/button/button'
import { EditorService } from '../../services/editor.service'
import { useCommonState } from './_common/common-state'
import { Dropdown } from '../../components/dropdown/dropdown'
import { MenuItem } from '../../components/menu-item/menu-item'
import { Divider } from '../../components/divider/divider'
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

  let isClickFromSelf = false
  const sub = fromEvent(document, 'click').subscribe(() => {
    if (isClickFromSelf) {
      isClickFromSelf = false
      return
    }
    editorService.hideInlineToolbar = false
    viewModel.showModal = false
  })

  const instance = getCurrentInstance()

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
    content: '',
    type: 'translate' as keyof LLMService
  })

  const dropdownRef = createRef<typeof Dropdown>()

  let subscription = new Subscription()

  function continueContent() {
    viewModel.type = 'continue'
    viewModel.content = ''
    props.hideToolbar?.()
    viewModel.showModal = true
    dropdownRef.current!.isShow(false)
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
    dropdownRef.current!.isShow(false)
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
    dropdownRef.current!.isShow(false)
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
    dropdownRef.current!.isShow(false)
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
    dropdownRef.current!.isShow(false)
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
    dropdownRef.current!.isShow(false)
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
    aiContentRef.current!.childNodes.forEach(node => {
      const slot = parser.parse(node instanceof HTMLElement ? node : node.textContent || '', new Slot([
        ContentType.BlockComponent,
        ContentType.InlineComponent,
        ContentType.Text
      ]))

      commander.paste(slot, aiContentRef.current!.innerText)
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

  return withScopedCSS(css, () => {
    const rect = popupPosition(400, 210)!

    const b = commonState().inSourceCode || commonState().readonly || selection.isCollapsed
    return (
      <>
        <Dropdown ref={dropdownRef} disabled={b} width={'160px'} menu={
          !viewModel.showModal ? <div onClick={() => isClickFromSelf = true}>
            <MenuItem icon={<span class="xnote-icon-continuation"></span>} onClick={continueContent}>续写</MenuItem>
            <MenuItem icon={<span class="xnote-icon-magic-wand"></span>} onClick={polish}>润色</MenuItem>
            <MenuItem icon={<span class="xnote-icon-simplify"></span>} onClick={simplify}>简化内容</MenuItem>
            <MenuItem icon={<span class="xnote-icon-enrich"></span>} onClick={enrich}>丰富内容</MenuItem>
            <Divider/>
            <Dropdown style={{
              display: 'block'
            }} abreast={true} menu={
              <div onClick={() => isClickFromSelf = true}>
                {translationLanguages.map((lang) => {
                  return <MenuItem key={lang} onClick={() => translate(lang)}>{lang}</MenuItem>
                })}
              </div>
            }>
              <MenuItem arrow={true} icon={<span class="xnote-icon-translation"></span>}>翻译</MenuItem>
            </Dropdown>
            <MenuItem icon={<span class="xnote-icon-summary"></span>} onClick={summarize}>总结</MenuItem>
          </div> : null
        }>
          <Button arrow={true} disabled={b}>
            <span class="xnote-icon-ai"></span>
          </Button>
        </Dropdown>
        {
          viewModel.showModal &&
          <Popup left={rect.left} top={rect.top}>
            <div onClick={() => {
              isClickFromSelf = true
            }} class="input-group">
              <div class="ai-content" ref={aiContentRef}>
                {renderMarkdown(viewModel.content)}
              </div>
              <div class="btn-group">
                <Button type="button" onClick={replace}>替换</Button>
                <Button type="button" onClick={insert}>插入</Button>
              </div>
            </div>
          </Popup>
        }
      </>
    )
  })
}
