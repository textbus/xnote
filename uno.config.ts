import { defineConfig, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  // 将 .scss / .css 中的 @apply 展开为真实规则；否则 @apply 会原样进产物，浏览器不识别
  transformers: [transformerDirectives()],
})
