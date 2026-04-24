# XNote Playground

本包用于本地联调 `@textbus/xnote`，不对外发布。

## 启动

```bash
pnpm --filter @textbus/xnote-playground dev
```

或在仓库根目录运行：

```bash
pnpm start
```

## 构建

```bash
pnpm --filter @textbus/xnote-playground build
```

## 说明

- 默认开发端口：`5636`
- 通过 alias 直接引用 `../editor/src/public-api.ts`，便于边改库边验证
