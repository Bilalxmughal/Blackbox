import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LeftPanel from '../LeftPanel/LeftPanel'
import Footer from '../Footer/Footer'
import styles from './Layout.module.css'

function Layout() {
  const { currentUser } = useAuth()

  return (
    <div className={styles.layout}>
      <LeftPanel />
      <div className={styles.mainContent}>
        <header className={styles.topHeader}>
          <h2>BusCaro - BlackBox CRM</h2>
          <div className={styles.userInfo}>
            <span>Welcome, {currentUser?.name || 'Admin'}</span>
            <div className={styles.userAvatar}>
              {(currentUser?.name || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default Layout