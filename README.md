# XNote

**English** | **[简体中文](README.zh-CN.md)**

XNote is a headless, high-performance, framework-agnostic rich-text editor with multi-user online collaboration. It offers a rich set of modern document-editing features.

XNote builds on the open-source rich-text framework [Textbus](https://textbus.io) and the front-end framework [Viewfly](https://viewfly.org), so you can keep extending it with your own features on top.

## Table of contents

- [Live demo](#live-demo)
- [Installation](#installation)
- [Usage](#usage)
- [Internationalization (i18n)](#internationalization-i18n)
- [File upload](#file-upload)
- [Paste images: Base64 to URL](#paste-images-base64-to-url)
- [Get HTML](#get-html)
- [Set initial HTML](#set-initial-html)
- [Update editor content](#update-editor-content)
- [At mentions](#at-mentions)
- [Collaboration](#collaboration)
- [About this repository](#about-this-repository)
- [See also](#see-also)

## Live demo

Try the collaborative demo online: [https://textbus.io/playground.html](https://textbus.io/playground.html)

## Installation

Math typesetting relies on KaTeX styles, so install both packages:

```bash
npm install @textbus/xnote katex
```

## Usage

Import KaTeX CSS once, create an **`Editor`**, then **`mount`** it on the element that should host the editor. When the promise resolves, the instance is ready to use.

```ts
import 'katex/dist/katex.min.css'
import { Editor } from '@textbus/xnote'

const editor = new Editor()
editor.mount(document.getElementById('editor')!).then(() => {
  console.log('Editor is ready.')
})
```

## Internationalization (i18n)

Toolbar labels and other UI strings go through **`I18nService`**, one per editor. Set **`locale`** (for example `en-US` or `zh-CN`) when you construct **`Editor`**, and pass **`messages`** if you only want to tweak a few keys. The key names line up with the exported **`XnoteMessageKey`** type.

```ts
import { Editor } from '@textbus/xnote'

const editor = new Editor({
  locale: 'en-US',
  messages: {
    'toolbar.copy': 'Copy',
  },
})
```

The default catalog lives in [`packages/editor/src/i18n/messages.ts`](packages/editor/src/i18n/messages.ts). You can layer changes through **`EditorConfig.messages`** instead of maintaining a fork.

## File upload

When users pick an image or video from the toolbar, the editor asks your app for a URL. Implement **`FileUploader`** and return either a string or a promise that resolves to one.

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

## Paste images: Base64 to URL

Pasted images often land as huge **base64** strings. If you would rather store a normal URL, subclass **`Commander`**, intercept **`paste`**, rewrite **`ImageComponent`** URLs after your upload finishes, then forward to **`super.paste`**.

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
        // Replace with your own upload / URL resolution
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

## Get HTML

The editor can serialize the current document to HTML for saving or preview:

```ts
const html = editor.getHTML()
```

## Set initial HTML

Pass **`content`** when you construct **`Editor`** if you already have HTML to show on first paint:

```ts
const editor = new Editor({
  content: '<div>Your HTML</div>'
})
```

## Update editor content

Later, replace the whole document from a string with **`setContent`**:

```ts
editor.setContent('<p>Hello!</p>')
```

## At mentions

**@** completion is wired through **`Organization`**: you fetch a member list for the query string, then commit the user’s choice. Declare the contract, implement it for your backend, and register the instance through **`providers`**.

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

## Collaboration

Turn on collaboration by supplying **`collaborateConfig`** on **`Editor`**. Your **`createConnector`** factory receives the shared **`Y.Doc`** and should return a **`SyncConnector`** (for example **`YWebsocketConnector`**) that matches your server. The official guide walks through **Yjs**, **`MessageBus`**, and the rest: [**Collaborative editing**](https://textbus.io/guide/collaborate.html).

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

## About this repository

XNote lives in a small **monorepo**:

| Path | What you will find there |
|------|---------------------------|
| [`packages/editor`](packages/editor) | Library source and build artifacts for **`@textbus/xnote`** |
| [`packages/playground`](packages/playground) | A Vite app for hacking on the editor locally; see its README for scripts |

The editor does not assume React, Vue, or any other host framework—you bring a DOM host and plug in. Extension points match what you already know from **Textbus** and **Viewfly**.

[`packages/editor/README.md`](packages/editor/README.md) is the readme that ships on npm; it points at the `src/` tree for people browsing the package tarball.

## See also

- [**Textbus**](https://textbus.io) — the editing core  
- [**Viewfly**](https://viewfly.org) — the front-end framework used here  
- [**Collaborative editing**](https://textbus.io/guide/collaborate.html) — collaboration in depth  
- [**Playground**](https://textbus.io/playground.html) — try the editor online  
- [**Issues**](https://github.com/textbus/xnote/issues) — report bugs or suggest features  
