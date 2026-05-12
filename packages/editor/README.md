# @textbus/xnote

**[English](README.md)** | **[简体中文](README.zh-CN.md)**

This directory is the **npm package** for XNote: a headless, collaborative rich-text editor built on the open-source [Textbus](https://textbus.io) rich-text stack and the front-end framework [Viewfly](https://viewfly.org).

Full documentation—installation, i18n, file upload, collaboration, and the rest—lives at the **repository root** so it stays in one place:

| | In this repo | On GitHub |
|---|----------------|-----------|
| **English** | [README.md](../../README.md) | [Open](https://github.com/textbus/xnote/blob/main/README.md) |
| **简体中文** | [README.zh-CN.md](../../README.zh-CN.md) | [Open](https://github.com/textbus/xnote/blob/main/README.zh-CN.md) |

## Quick start

```bash
npm install @textbus/xnote katex
```

```ts
import 'katex/dist/katex.min.css'
import { Editor } from '@textbus/xnote'

const editor = new Editor()
await editor.mount(document.getElementById('editor')!)
```

## Internationalization (i18n)

UI string keys are defined in [`src/i18n/messages.ts`](./src/i18n/messages.ts). Pass **`locale`** and optional **`messages`** on **`Editor`** (see the root readme for examples).

## Useful links

- [Playground](https://textbus.io/playground.html) — try the editor in the browser  
- [Collaboration guide](https://textbus.io/guide/collaborate.html) — Textbus collaboration  
- [Issues](https://github.com/textbus/xnote/issues) — this repository  
