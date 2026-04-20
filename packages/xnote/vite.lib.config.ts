import { defineConfig } from 'vite'
import swc from 'vite-plugin-swc-transform'
import dts from 'vite-plugin-dts'
import scopedCssPlugin from '@viewfly/devtools/vite-scoped-css-plugin'
import fs from 'fs'
import path from 'path'

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))
const externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]
const escapedExternalPackages = externalPackages.map((name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
const externalMatcher = new RegExp(`^(${escapedExternalPackages.join('|')})(\\/.*)?$`)

export default defineConfig({
  plugins: [
    scopedCssPlugin(true),
    swc({
      swcOptions: {
        jsc: {
          target: 'es2020',
          externalHelpers: true,
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
    dts({
      outDir: 'dist',
      entryRoot: 'src',
      rollupTypes: true,
      insertTypesEntry: true,
      include: ['src', 'types.d.ts'],
    })
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    lib: {
      entry: 'src/public-api.ts',
      formats: ['cjs', 'es'],
      fileName: (format) => format === 'es' ? 'index.esm.js' : 'index.js',
      cssFileName: 'index.css',
    },
    rollupOptions: {
      external: (id) => externalMatcher.test(id),
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] || ''
          if (/\.css$/.test(name)) {
            return 'index.css'
          }
          if (/\.(woff2?|ttf|otf|eot|svg)$/.test(name)) {
            return 'fonts/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      },
    }
  }
})
