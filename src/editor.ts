import { ViewflyAdapter, ViewflyVDomAdapter } from '@textbus/adapter-viewfly'
import { createApp, HTMLRenderer, OutputTranslator } from '@viewfly/platform-browser'
import { BrowserModule, DomAdapter, Parser } from '@textbus/platform-browser'
import { CollaborateConfig, CollaborateModule } from '@textbus/collaborate'
import { Component, ContentType, Module, Slot, Textbus } from '@textbus/core'
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

export interface XNoteConfig {
  content?: string,
  collaborateConfig?: CollaborateConfig
  readonly?: boolean
}

export async function createXNote(host: HTMLElement, config: XNoteConfig = {}) {
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
      useFactory() {
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
  const browserModule = new BrowserModule({
    renderTo(): HTMLElement {
      return host
    },
    adapter,
    componentLoaders: [
      highlightBoxComponentLoader,
      blockquoteComponentLoader,
      paragraphComponentLoader,
      sourceCodeComponentLoader,
      todolistComponentLoader,
      tableComponentLoader,
      listComponentLoader,
      imageComponentLoader,
      videoComponentLoader
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
    ]
  })

  const modules: Module[] = [browserModule]
  if (config.collaborateConfig) {
    modules.push(new CollaborateModule(config.collaborateConfig))
  }

  const textbus = new Textbus({
    additionalAdapters: [vDomAdapter],
    zenCoding: true,
    readonly: config.readonly,
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
    providers: [],
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
    }
  })

  let rootComp: Component
  if (config.content) {
    const parser = textbus.get(Parser)
    const doc = parser.parseDoc(config.content, rootComponentLoader)
    rootComp = doc instanceof Component ? doc : new RootComponent(textbus, {
      heading: new Slot([ContentType.Text]),
      content: doc as Slot
    })
  } else {
    rootComp = new RootComponent(textbus, {
      heading: new Slot([ContentType.Text]),
      content: new Slot([ContentType.Text, ContentType.InlineComponent, ContentType.BlockComponent])
    })
  }
  await textbus.render(rootComp)
  const translator = new OutputTranslator()
  return {
    textbus,
    getHTML() {
      return translator.transform(vDomAdapter.host)
    }
  }
}
