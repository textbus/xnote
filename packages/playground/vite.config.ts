import path from 'path'
import ip from 'ip'
import { defineConfig, type Plugin } from 'vite'
import UnoCSS from 'unocss/vite'

import swc from 'vite-plugin-swc-transform'
import checker from 'vite-plugin-checker'
import viteScopedCssPlugin from '@viewfly/devtools/vite-scoped-css-plugin'

export default defineConfig({
  plugins: [
    UnoCSS({ configFile: path.resolve(__dirname, '../../uno.config.ts') }),
    ...(viteScopedCssPlugin() as Plugin[]),
    swc({
      swcOptions: {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
            tsx: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
            useDefineForClassFields: false,
            react: {
              runtime: 'automatic',
              importSource: '@viewfly/core',
              throwIfNamespace: true,
            },
          },
        },
      }
    }),
    checker({
      typescript: true,
    })
  ],
  resolve: {
    alias: {
      '@textbus/xnote': path.resolve(__dirname, '../xnote/src/public-api.ts'),
    }
  },
  server: {
    host: ip.address(),
    port: 5636,
    open: true,
    proxy: {
      '/api/llm': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api\/llm/, '/llm')
      }
    }
  }
})
