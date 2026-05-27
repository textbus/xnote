/* eslint-disable */
import 'reflect-metadata'
import { createSignal, inject, onMounted } from '@viewfly/core'
import { createApp } from '@viewfly/platform-browser'
import { Link, Router, RouterModule, RouterOutlet } from '@viewfly/router'
import { demoNavItems, demoRoutes } from './pages/routes'
import './styles.css'

function App() {
  const router = inject(Router)
  const isMobileRoute = createSignal(router.path === 'mobile')

  onMounted(() => {
    const subscription = router.onRefresh.subscribe(() => {
      isMobileRoute.set(router.path === 'mobile')
    })
    return () => subscription.unsubscribe()
  })

  return () => {
    const mobile = isMobileRoute()
    return (
      <div class={`playground-page${mobile ? ' playground-page--mobile' : ''}`}>
        <div class="playground-shell playground-header">
          <h2 class="playground-title">XNote Playground</h2>
          <p class="playground-subtitle">工具条能力演示与协作编辑体验</p>
        </div>
        <div class="playground-shell playground-layout">
          {!mobile && (
            <aside class="playground-sidebar">
              {demoNavItems.map(item => {
                return (
                  <Link
                    key={item.to}
                    exact={item.exact}
                    to={item.to}
                    active="active"
                    class="playground-nav-link"
                  >
                    {item.label}
                  </Link>
                )
              })}
            </aside>
          )}
          <div class="playground-content">
            <RouterOutlet>
              未匹配到演示页面
            </RouterOutlet>
          </div>
        </div>
      </div>
    )
  }
}

createApp(<App/>).use(new RouterModule({ routes: demoRoutes })).mount(document.getElementById('app')!)
