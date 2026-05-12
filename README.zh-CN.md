# XNote

**[English](README.md)** | **简体中文**

Xnote 是一个无头、高性能、与框架无关的富文本编辑器，支持多人在线协作。提供了丰富的现代文档编辑功能。

Xnote 底层依赖于开源富文本框架 [Textbus](https://textbus.io) 和前端框架 [Viewfly](https://viewfly.org)。因此，你可以在此基础上继续扩展自己的功能。

## 目录

- [在线演示](#在线演示)
- [安装](#安装)
- [使用](#使用)
- [国际化（i18n）](#国际化i18n)
- [文件上传](#文件上传)
- [粘贴图片：Base64 转 URL](#粘贴图片base64-转-url)
- [获取 HTML](#获取-html)
- [设置初始 HTML](#设置初始-html)
- [更新编辑器内容](#更新编辑器内容)
- [At 提及](#at-提及)
- [协作](#协作)
- [关于本仓库](#关于本仓库)
- [延伸阅读](#延伸阅读)

## 在线演示

在线体验协作演示：[https://textbus.io/playground.html](https://textbus.io/playground.html)

## 安装

数学公式依赖 KaTeX 的样式文件，请同时安装：

```bash
npm install @textbus/xnote katex
```

## 使用

引入 KaTeX 的 CSS 后，创建 **`Editor`** 并 **`mount`** 到宿主节点；`Promise` 完成即表示编辑器已就绪。

```ts
import 'katex/dist/katex.min.css'
import { Editor } from '@textbus/xnote'

const editor = new Editor()
editor.mount(document.getElementById('editor')!).then(() => {
  console.log('编辑器准备完成。')
})
```

## 国际化（i18n）

工具栏等界面文案由 **`I18nService`** 管理，每个编辑器实例各有一份。构造 **`Editor`** 时设置 **`locale`**（如 `zh-CN`、`en-US`），需要微调时用 **`messages`** 传入少量键值即可，键名与 **`XnoteMessageKey`** 类型对应。

```ts
import { Editor } from '@textbus/xnote'

const editor = new Editor({
  locale: 'en-US',
  messages: {
    'toolbar.copy': 'Copy',
  },
})
```

默认文案集中在 [`packages/editor/src/i18n/messages.ts`](packages/editor/src/i18n/messages.ts)；业务侧也可用 **`EditorConfig.messages`** 覆盖，而不必改库。

## 文件上传

用户在工具栏插入图片或视频时，编辑器会回调你的 **`FileUploader`**，由你返回最终可访问的地址（同步或 Promise 均可）。

```ts
import { FileUploader } from '@textbus/xnote'

class YourUploader extends FileUploader {
  uploadFile(type: string): string | Promise<string> {
    if (type === 'image') {
      return 'imageUrl'
    }
    if (type === 'video') {
      return 'videoUrl'
    }
    return ''
  }
}

const editor = new Editor({
  providers: [{
    provide: FileUploader,
    useFactory() {
      return new YourUploader()
    }
  }]
})
```

## 粘贴图片：Base64 转 URL

粘贴进来的图片常常是 **Base64** 大段数据。若希望落库或展示都用普通 URL，可继承 **`Commander`**，在 **`paste`** 里完成上传或转链，再调用 **`super.paste`** 走默认粘贴逻辑。

```ts
import { Commander, Slot } from '@textbus/core'
import { Injectable } from '@viewfly/core'
import { ImageComponent } from '@textbus/xnote'

@Injectable()
class YourCommander extends Commander {
  paste(slot: Slot, text: string) {
    slot.sliceContent().forEach(content => {
      if (content instanceof ImageComponent) {
        const base64 = content.state.url
        content.state.url = 'https://xxx.com/xxx.jpg'
      }
    })

    super.paste(slot, text)
    return true
  }
}

const editor = new Editor({
  providers: [{
    provide: Commander,
    useClass: YourCommander
  }]
})
```

## 获取 HTML

需要把当前文档导出成 HTML 以便保存或预览时：

```ts
const html = editor.getHTML()
```

## 设置初始 HTML

首屏就有内容时，可在创建 **`Editor`** 时传入 **`content`**：

```ts
const editor = new Editor({
  content: '<div>HTML 内容</div>'
})
```

## 更新编辑器内容

之后若要用一段 HTML 整体替换文档，可调用 **`setContent`**：

```ts
editor.setContent('<p>你好！</p>')
```

## At 提及

文档里的 **@** 能力通过 **`Organization`** 接入：根据输入拉成员列表，用户选定后再写回编辑器。实现该抽象类，并在 **`providers`** 里挂上你的实例即可。

```ts
export abstract class Organization {
  abstract getMembers(name?: string): Promise<Member[]>

  abstract atMember(member: Member): void
}
```

```ts
const editor = new Editor({
  providers: [{
    provide: Organization,
    useValue: new YourOrganization()
  }]
})
```

## 协作

在 **`Editor`** 上配置 **`collaborateConfig`**，在 **`createConnector`** 里返回与后端协议一致的 **`SyncConnector`**（例如 **`YWebsocketConnector`**），并保证与 Textbus 传入的 **`Y.Doc`** 为同一份。官方文档对 **Yjs**、**`MessageBus`** 等有系统说明：[**协作编辑**](https://textbus.io/guide/collaborate.html)。

```ts
const editor = new Editor({
  collaborateConfig: {
    userinfo: user,
    createConnector(yDoc): SyncConnector {
      return new YWebsocketConnector('wss://example.com', 'docName', yDoc)
    }
  }
})
```

## 关于本仓库

XNote 以 **monorepo** 形式维护，主要包括：

| 路径 | 内容 |
|------|------|
| [`packages/editor`](packages/editor) | **`@textbus/xnote`** 的源码与构建产物 |
| [`packages/playground`](packages/playground) | 本地 Vite 联调工程，脚本说明见该目录 README |

编辑器本身不要求宿主使用某一前端框架，只要能挂 DOM 即可；扩展方式与 **Textbus**、**Viewfly** 上游习惯一致。

[`packages/editor/README.md`](packages/editor/README.md) 会随 npm 包一起发布，其中简要说明了 `src/` 目录结构，方便在包内浏览。

## 延伸阅读

- [**Textbus**](https://textbus.io) — 编辑与文档模型  
- [**Viewfly**](https://viewfly.org) — 视图层  
- [**协作编辑**](https://textbus.io/guide/collaborate.html) — 协作与连接器详解  
- [**在线协作演示**](https://textbus.io/playground.html) — 在线试用  
- [**问题反馈**](https://github.com/textbus/xnote/issues) — 缺陷与需求  
