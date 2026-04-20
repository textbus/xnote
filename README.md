XNote Monorepo
====================

此仓库已改造为 `pnpm` monorepo，包含库包与本地调试 playground。

## 包结构

- `packages/xnote`：`@textbus/xnote` 库源码与构建配置
- `packages/playground`：本地演示与联调项目

## 常用命令

```bash
pnpm install
pnpm start
pnpm run build
pnpm run build:lib
pnpm run build:playground
```

## 文档位置

- 库包使用文档见 `packages/xnote/README.md`
- 在线演示：[https://textbus.io/playground/](https://textbus.io/playground/)



