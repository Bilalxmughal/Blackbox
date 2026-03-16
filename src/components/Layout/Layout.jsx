import { Outlet } from 'react-router-dom'
import LeftPanel from '../LeftPanel/LeftPanel'
import Footer from '../Footer/Footer'
import styles from './Layout.module.css'

function Layout() {
  return (
    <div className={styles.layout}>
      <LeftPanel />
      <div className={styles.mainContent}>
        <header className={styles.topHeader}>
          <h2>BusCaro - BlackBox CRM</h2>
          <div className={styles.userInfo}>
            <span>Welcome, Admin</span>
            <div className={styles.userAvatar}>A</div>
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