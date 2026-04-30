/* eslint-disable */
import 'reflect-metadata'
import { createApp } from '@viewfly/platform-browser'
import { Link, RouterModule, RouterOutlet } from '@viewfly/router'
import { user } from './demos/demo-context'
import { demoNavItems, demoRoutes } from './demos/routes'
import './styles.css'

function App() {
  return () => {
    return (
      <div class="playground-page">
        <div class="playground-shell playground-header">
          <h2 class="playground-title">XNote Playground</h2>
          <p class="playground-subtitle">工具条能力演示与协作编辑体验</p>
        </div>
        <div class="playground-shell playground-layout">
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

void user
createApp(<App/>).use(new RouterModule({ routes: demoRoutes })).mount(document.getElementById('app')!)
