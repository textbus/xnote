import { CollaborativeEditorDemo } from './pages/collaborative-editor-demo'
import { InlineAndLeftDemo } from './pages/inline-left-demo'
import { StaticDemo } from './pages/static-demo'
import { SuspensionDemo } from './pages/suspension-demo'

export const demoNavItems = [
  { to: '/', label: '协作编辑器', exact: true },
  { to: '/inline-left', label: '行内 + 左侧' },
  { to: '/suspension', label: '悬浮' },
  { to: '/static', label: '静态' }
]

export const demoRoutes = [
  {
    path: '',
    component: CollaborativeEditorDemo
  },
  {
    path: 'inline-left',
    component: InlineAndLeftDemo
  },
  {
    path: 'suspension',
    component: SuspensionDemo
  },
  {
    path: 'static',
    component: StaticDemo
  }
]
