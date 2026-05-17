import { defineConfig, presetWind3, transformerDirectives } from 'unocss'

const primary = {
  DEFAULT: '#296eff',
  50: '#eef4ff',
  100: '#dce8ff',
  200: '#b8d0ff',
  300: '#7eabff',
  400: '#4d8dff',
  500: '#296eff',
  600: '#1d5ae6',
  700: '#1748b8',
  800: '#153d96',
  900: '#132f73',
} as const

const success = {
  DEFAULT: '#16a34a',
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
} as const

const warning = {
  DEFAULT: '#d97706',
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
} as const

const danger = {
  DEFAULT: '#dc2626',
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
} as const

const info = {
  DEFAULT: '#0891b2',
  50: '#ecfeff',
  100: '#cffafe',
  200: '#a5f3fc',
  300: '#67e8f9',
  400: '#22d3ee',
  500: '#06b6d4',
  600: '#0891b2',
  700: '#0e7490',
  800: '#155e75',
  900: '#164e63',
} as const

export default defineConfig({
  transformers: [transformerDirectives()],
  presets: [
    presetWind3({
      dark: 'class',
    }),
  ],
  theme: {
    colors: {
      primary,
      success,
      warning,
      danger,
      info,
    },
  },
  shortcuts: {
    'xnote-page': 'min-h-screen bg-[var(--vfui-page-bg)] text-[var(--vfui-fg-default)]',
    'xnote-surface': 'bg-[var(--vfui-surface)]',
    'xnote-surface-elevated': 'bg-[var(--vfui-surface-elevated)]',
    'xnote-text-muted': 'text-[var(--vfui-fg-muted)]',
    'xnote-border-default': 'border-[var(--vfui-border-default)]',
    'xnote-flex-between': 'flex justify-between flex-1',
    'xnote-flex-between-grow': 'flex flex-1 justify-between',
    'xnote-flex-center': 'flex items-center',
    'xnote-menu-check-icon': 'ml-1 text-primary',
    'xnote-text-nowrap': 'whitespace-nowrap',
    'xnote-w-menu-36': 'w-36',
    'xnote-w-menu-40': 'w-40',
    'xnote-w-menu-45': 'w-45',
    'xnote-w-menu-46': 'w-46',
    'xnote-w-menu-52': 'w-52',
    'xnote-anchor-tr': 'absolute right-0 top-0',
    'xnote-toolbar-compact-btn': 'h-7 min-w-8',
    'xnote-toolbar-label-inline': 'inline-flex items-center',
    'xnote-toolbar-tools-wrap': 'flex flex-wrap gap-1 pt-1',
    'xnote-ai-popover': 'h-50 w-100 flex flex-col',
    'xnote-ai-popover-body': 'flex-1 overflow-y-auto p-2',
    'xnote-ai-popover-footer': 'flex justify-end gap-2 p-2',
    'xnote-link-tool-form': 'p-1',
    'xnote-comment-tool-form': 'p-1',
    'xnote-source-code-toolbar-row': 'flex items-center text-[13px]',
    'xnote-insert-menu': 'w-46',
  },
})
