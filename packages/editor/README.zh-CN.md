# @textbus/xnote

**[English](README.md)** | **[简体中文](README.zh-CN.md)**

本目录即 npm 包 **`@textbus/xnote`** 的源码：一款无头、支持协作的富文本编辑器，底层基于开源富文本框架 [Textbus](https://textbus.io) 与前端框架 [Viewfly](https://viewfly.org)。

完整使用说明（安装、国际化、文件上传、协作等）放在**仓库根目录**统一维护，避免多处重复：

| | 本仓库路径 | GitHub |
|---|------------|--------|
| **English** | [README.md](../../README.md) | [打开](https://github.com/textbus/xnote/blob/main/README.md) |
| **简体中文** | [README.zh-CN.md](../../README.zh-CN.md) | [打开](https://github.com/textbus/xnote/blob/main/README.zh-CN.md) |

## 快速开始

```bash
npm install @textbus/xnote katex
```

```ts
import 'katex/dist/katex.min.css'
import { Editor } from '@textbus/xnote'

const editor = new Editor()
await editor.mount(document.getElementById('editor')!)
```

## 国际化（i18n）

界面文案的键值定义在 [`src/i18n/messages.ts`](./src/i18n/messages.ts)。创建 **`Editor`** 时传入 **`locale`** 与可选的 **`messages`**（示例见仓库根目录中文或英文 readme）。

## 相关链接

- [Playground](https://textbus.io/playground.html) — 在线试玩编辑器  
- [协作编辑说明](https://textbus.io/guide/collaborate.html) — Textbus 协作  
- [问题反馈](https://github.com/textbus/xnote/issues) — 本仓库  
