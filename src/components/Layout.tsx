import { Outlet, NavLink } from 'react-router-dom'

const modules = [
  { path: '/number-system', label: '进制与编码' },
  { path: '/instruction-decoder', label: '指令解码' },
  { path: '/datapath', label: '数据通路' },
  { path: '/pipeline', label: '流水线' },
  { path: '/cache', label: 'Cache 模拟' },
]

export function Layout() {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <NavLink to="/" className="logo">
          CPU Explorer
        </NavLink>
        <ul className="nav-list">
          {modules.map((m) => (
            <li key={m.path}>
              <NavLink to={m.path} className="nav-link">
                {m.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
