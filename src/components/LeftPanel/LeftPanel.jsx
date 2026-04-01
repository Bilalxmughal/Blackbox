import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, Database, ClipboardList,
  Settings, Users, ChevronLeft, ChevronRight,
  LogOut, Building2, Truck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './LeftPanel.module.css'

const menuItems = [
  { name: 'Dashboard',        path: '/',           icon: LayoutDashboard, section: 'Main' },
  { name: 'Buscaro Ops Data', path: '/ops-data',   icon: Database,        section: 'Main' },
  { name: 'Complaint Board',  path: '/complaints', icon: ClipboardList,   section: 'Main' },
  { name: 'Clients',          path: '/clients',    icon: Building2,       section: 'Client' },
  { name: 'Vendors',          path: '/vendors',    icon: Truck,           section: 'Vendor' },
  { name: 'User Management',  path: '/users',      icon: Users,           section: 'System' },
  { name: 'Backend Settings', path: '/backend',    icon: Settings,        section: 'System' },
]

function LeftPanel({ collapsed, setCollapsed }) {
  const { currentUser, logout } = useAuth()

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  const sections = Object.keys(groupedItems)

  return (
    <aside className={`${styles.leftPanel} ${collapsed ? styles.collapsed : ''}`}>

      {/* Logo */}
      <div className={styles.logoSection}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>B</div>
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
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className={styles.navMenu}>
        {sections.map((section, idx) => (
          <div key={section}>
            {!collapsed && (
              <div className={styles.navSection}>{section}</div>
            )}
            {groupedItems[section].map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  data-title={item.name}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              )
            })}
            {!collapsed && idx < sections.length - 1 && (
              <div className={styles.navDivider} />
            )}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className={styles.userSection}>
        {!collapsed && (
          <div className={styles.userInfo}>
            <span>{currentUser?.name || 'Guest'}</span>
            <small>{currentUser?.department || 'No Dept'}</small>
          </div>
        )}
        <button onClick={logout} className={styles.logoutBtn} title="Logout">
          <LogOut size={16} />
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className={styles.panelFooter}>
          <p>v1.0.0</p>
          <p>© 2026 BusCaro</p>
        </div>
      )}
    </aside>
  )
}

export default LeftPanel