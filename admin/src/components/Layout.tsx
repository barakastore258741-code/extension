import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Layout.module.css'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◈', end: true },
  { to: '/licenses', label: 'Licenses', icon: '🔑' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/feature-flags', label: 'Feature Flags', icon: '⚡' },
  { to: '/versions', label: 'Versions', icon: '📦' },
  { to: '/packages', label: 'Packages', icon: '💳' },
]

export default function Layout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <div className={styles.logo}>TV</div>
            <div>
              <span className={styles.brandName}>TechVai</span>
              <span className={styles.brandSub}>Admin Panel</span>
            </div>
          </div>
          <nav className={styles.nav}>
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>↩</span> Logout
        </button>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
