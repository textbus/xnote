import { ViewflyAdapter, ViewflyVDomAdapter } from '@textbus/adapter-viewfly'
import { createApp, HTMLRenderer, OutputTranslator } from '@viewfly/platform-browser'
import { BrowserModule, DomAdapter, Parser, ViewOptions } from '@textbus/platform-browser'
import { CollaborateConfig, CollaborateModule } from '@textbus/collaborate'
import { Component, ContentType, Module, Slot, Textbus, TextbusConfig } from '@textbus/core'
import { ReflectiveInjector } from '@viewfly/core'

import './assets/icons/style.css'

import {
  BlockquoteView,
  blockquoteComponentLoader,
  HighlightBoxView,
  highlightBoxComponentLoader,
  ListComponentView,
  ParagraphView,
  paragraphComponentLoader,
  RootView,
  rootComponentLoader,
  SourceCodeView,
  sourceCodeComponentLoader,
  tableComponentLoader,
  TableComponentView,
  TodolistView,
  todolistComponentLoader,
  listComponentLoader,
  ParagraphComponent,
  RootComponent,
  BlockquoteComponent,
  TodolistComponent,
  SourceCodeComponent,
  TableComponent,
  HighlightBoxComponent,
  ListComponent,
  ImageComponent,
  ImageView,
  imageComponentLoader, videoComponentLoader, VideoComponent, VideoView
} from './textbus/components/_api'
import { LeftToolbarPlugin, ToolbarPlugin } from './plugins/_api'
import {
  backgroundColorFormatLoader,
  backgroundColorFormatter,
  boldFormatLoader,
  boldFormatter,
  codeFormatLoader,
  codeFormatter,
  colorFormatLoader,
  colorFormatter,
  fontFamilyFormatLoader,
  fontFamilyFormatter,
  fontSizeFormatLoader,
  fontSizeFormatter,
  italicFormatLoader,
  italicFormatter,
  linkFormatLoader,
  linkFormatter,
  registerBoldShortcut,
  registerCodeShortcut,
  registerItalicShortcut,
  registerStrikeThroughShortcut,
  registerUnderlineShortcut,
  strikeThroughFormatLoader,
  strikeThroughFormatter,
  underlineFormatLoader,
  underlineFormatter
} from './textbus/formatters/_api'
import './textbus/doc.scss'
import { headingAttr, headingAttrLoader, registerHeadingShortcut } from './textbus/attributes/heading.attr'
import { registerTextAlignShortcut, textAlignAttr, textAlignAttrLoader } from './textbus/attributes/text-align.attr'
import { registerTextIndentShortcut, textIndentAttr, textIndentAttrLoader } from './textbus/attributes/text-indent.attr'
import { OutputInjectionToken } from './textbus/injection-tokens'

export interface EditorConfig extends TextbusConfig {
  content?: string,
  collaborateConfig?: CollaborateConfig,
  viewOptions?: Partial<ViewOptions>
}

export class Editor extends Textbus {
  translator = new OutputTranslator()
  private host!: HTMLElement
  private vDomAdapter: ViewflyVDomAdapter

  constructor(private editorConfig: EditorConfig = {}) {
    const adapter = new ViewflyAdapter({
      [ParagraphComponent.componentName]: ParagraphView,
      [RootComponent.componentName]: RootView,
      [BlockquoteComponent.componentName]: BlockquoteView,
      [TodolistComponent.componentName]: TodolistView,
      [SourceCodeComponent.componentName]: SourceCodeView,
      [TableComponent.componentName]: TableComponentView,
      [HighlightBoxComponent.componentName]: HighlightBoxView,
      [ListComponent.componentName]: ListComponentView,
      [ImageComponent.componentName]: ImageView,
      [VideoComponent.componentName]: VideoView
    }, (host, root, injector) => {
      const appInjector = new ReflectiveInjector(injector, [{
        provide: OutputInjectionToken,
        useValue: false
      }])
      const app = createApp(root, {
        context: appInjector
      }).mount(host)

      return () => {
        app.destroy()
      }
    })

    const browserModule = new BrowserModule({
      renderTo: (): HTMLElement => {
        return this.host
      },
      adapter,
      componentLoaders: [
        sourceCodeComponentLoader,
        tableComponentLoader,
        imageComponentLoader,
        videoComponentLoader,
        highlightBoxComponentLoader,
        blockquoteComponentLoader,
        paragraphComponentLoader,
        todolistComponentLoader,
        listComponentLoader,
      ],
      formatLoaders: [
        backgroundColorFormatLoader,
        boldFormatLoader,
        codeFormatLoader,
        colorFormatLoader,
        fontFamilyFormatLoader,
        fontSizeFormatLoader,
        italicFormatLoader,
        linkFormatLoader,
        strikeThroughFormatLoader,
        underlineFormatLoader
      ],
      attributeLoaders: [
        headingAttrLoader,
        textAlignAttrLoader,
        textIndentAttrLoader
      ],
      ...editorConfig.viewOptions
    })

    const modules: Module[] = [browserModule]
    if (editorConfig.collaborateConfig) {
      modules.push(new CollaborateModule(editorConfig.collaborateConfig))
    }
    const vDomAdapter = new ViewflyVDomAdapter({
      [ParagraphComponent.componentName]: ParagraphView,
      [RootComponent.componentName]: RootView,
      [BlockquoteComponent.componentName]: BlockquoteView,
      [TodolistComponent.componentName]: TodolistView,
      [SourceCodeComponent.componentName]: SourceCodeView,
      [TableComponent.componentName]: TableComponentView,
      [HighlightBoxComponent.componentName]: HighlightBoxView,
      [ListComponent.componentName]: ListComponentView,
      [ImageComponent.componentName]: ImageView,
      [VideoComponent.componentName]: VideoView
    } as any, (host, root, injector) => {
      const appInjector = new ReflectiveInjector(injector, [{
        provide: OutputInjectionToken,
        useValue: true
      }, {
        provide: DomAdapter,
        useFactory: () => {
          return vDomAdapter
        }
      }])
      const app = createApp(root, {
        context: appInjector,
        nativeRenderer: new HTMLRenderer()
      }).mount(host)

      return () => {
        app.destroy()
      }
    })
    super({
      zenCoding: true,
      additionalAdapters: [vDomAdapter],
      imports: modules,
      components: [
        ImageComponent,
        ParagraphComponent,
        RootComponent,
        BlockquoteComponent,
        TodolistComponent,
        SourceCodeComponent,
        TableComponent,
        HighlightBoxComponent,
        ListComponent,
        VideoComponent
      ],
      formatters: [
        backgroundColorFormatter,
        boldFormatter,
        codeFormatter,
        colorFormatter,
        fontFamilyFormatter,
        fontSizeFormatter,
        italicFormatter,
        linkFormatter,
        strikeThroughFormatter,
        underlineFormatter
      ],
      attributes: [
        headingAttr,
        textAlignAttr,
        textIndentAttr
      ],
      plugins: [
        new LeftToolbarPlugin(),
        new ToolbarPlugin(),
      ],
      onAfterStartup(textbus: Textbus) {
        registerBoldShortcut(textbus)
        registerCodeShortcut(textbus)
        registerItalicShortcut(textbus)
        registerStrikeThroughShortcut(textbus)
        registerUnderlineShortcut(textbus)

        registerHeadingShortcut(textbus)
        registerTextAlignShortcut(textbus)
        registerTextIndentShortcut(textbus)
      },
      ...editorConfig
    })

    this.vDomAdapter = vDomAdapter
  }

  mount(host: HTMLElement) {
    this.host = host
    let rootComp: Component
    const config = this.editorConfig
    if (config.content) {
      const parser = this.get(Parser)
      const doc = parser.parseDoc(config.content, rootComponentLoader)
      rootComp = doc instanceof Component ? doc : new RootComponent(this, {
        content: doc as Slot
      })
    } else {
      rootComp = new RootComponent(this, {
        content: new Slot([ContentType.BlockComponent])
      })
    }
    return this.render(rootComp)
  }

  getHTML() {
    return this.translator.transform(this.vDomAdapter.host)
  }
}
