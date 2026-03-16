// Add to menuItems array
const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Buscaro Ops Data', path: '/ops-data', icon: Database },
  { name: 'Complaint Board', path: '/complaints', icon: ClipboardList },
  { name: 'User Management', path: '/users', icon: Users },
  { name: 'Backend Settings', path: '/backend', icon: Settings },
]

// Add logout button in LeftPanel
import { useAuth } from '../../context/AuthContext'
import { LogOut } from 'lucide-react'

function LeftPanel() {
  const { currentUser, logout } = useAuth()
  // ... existing code

  return (
    <aside className={styles.leftPanel}>
      {/* ... existing code */}
      
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <span>{currentUser?.name}</span>
          <small>{currentUser?.department}</small>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}