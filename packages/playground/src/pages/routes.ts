import { CollaborativeEditorDemo } from './collaborative-editor-demo'
import { InlineAndLeftDemo } from './inline-left-demo'
import { MobileDemo } from './mobile-demo'
import { StaticDemo } from './static-demo'
import { SuspensionDemo } from './suspension-demo'

export const demoNavItems = [
  { to: '/', label: '协作编辑器', exact: true },
  { to: '/inline-left', label: '行内 + 左侧' },
  { to: '/suspension', label: '悬浮' },
  { to: '/static', label: '静态' },
  { to: '/mobile', label: '移动端' }
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
  },
  {
    path: 'mobile',
    component: MobileDemo
  }
]
