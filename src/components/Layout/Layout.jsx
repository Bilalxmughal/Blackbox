import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Database, 
  MessageSquare, 
  Settings, 
  Users, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import styles from './Layout.module.css'

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/ops-data', icon: Database, label: 'OPS Data' },
    { path: '/complaints', icon: MessageSquare, label: 'Complaints' },
    { path: '/backend', icon: Settings, label: 'Settings' },
    { path: '/users', icon: Users, label: 'Users' },
  ]

  return (
    <div className={styles.layout}>
      {/* Sidebar - Clean, no footer */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <button 
            className={styles.mobileClose}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <button 
        className={styles.mobileToggle}
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar - Welcome Left */}
        <div className={styles.topBar}>
          <div className={styles.welcome}>
            <h2>Welcome, {currentUser?.name || 'User'}</h2>
            <span>{currentUser?.department}</span>
          </div>
        </div>
        
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout