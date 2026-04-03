import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from "../../context/AuthContext"
import LeftPanel from '../LeftPanel/LeftPanel'
import styles from './Layout.module.css'



function Layout() {
  const { currentUser } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className={`${styles.layout} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <LeftPanel collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>


  {/* Mobile Hamburger Button */}
  <button 
    className={styles.mobileMenuBtn} 
    onClick={() => setMobileOpen(true)}
  >
    &#9776; {/* simple hamburger icon */}
  </button>

  {/* Mobile Overlay */}
  <div 
    className={`${styles.mobileOverlay} ${mobileOpen ? 'open' : ''}`} 
    onClick={() => setMobileOpen(false)}
  ></div>

      <div className={styles.mainContent}>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout