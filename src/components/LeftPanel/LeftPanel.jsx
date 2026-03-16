import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Database, 
  ClipboardList, 
  Settings, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react'
import styles from './LeftPanel.module.css'

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Buscaro Ops Data', path: '/ops-data', icon: Database },
  { name: 'Complaint Board', path: '/complaints', icon: ClipboardList },
  { name: 'Backend Settings', path: '/backend', icon: Settings },
]

function LeftPanel() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${styles.leftPanel} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logoSection}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🚌</span>
          {!collapsed && (
            <div className={styles.logoText}>
              <h1>BusCaro</h1>
              <span>BlackBox</span>
            </div>
          )}
        </div>
        <button 
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className={styles.navMenu}>
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          )
        })}
      </nav>

      {!collapsed && (
        <div className={styles.panelFooter}>
          <p>v1.0.0</p>
          <p>© 2024 BusCaro</p>
        </div>
      )}
    </aside>
  )
}

export default LeftPanel