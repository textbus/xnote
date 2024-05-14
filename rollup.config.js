const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('rollup-plugin-typescript2')
const postcss = require('@viewfly/devtools/rollup-plugin-postcss')

module.exports = {
  input: 'src/public-api.ts',
  output: [
    {
      file: './bundles/index.js',
      format: 'cjs'
    },
    {
      file: './bundles/index.esm.js',
      format: 'esm'
    }
  ],
  plugins: [
    commonjs(),
    typescript(),
    postcss({
      minimize: true
    })
  ]
}
