import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Database, LayoutDashboard, LogOut } from 'lucide-react';
import styles from './Layout.module.css';

function Layout({ children, user, onLogout }) {
  const location = useLocation();

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Buscaro</h2>
        </div>
        
        <nav className={styles.nav}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          
          <Link 
            to="/users" 
            className={`${styles.navLink} ${location.pathname === '/users' ? styles.active : ''}`}
          >
            <Users size={20} />
            User Management
          </Link>
          
          <Link 
            to="/ops-data" 
            className={`${styles.navLink} ${location.pathname === '/ops-data' ? styles.active : ''}`}
          >
            <Database size={20} />
            OPS Data
          </Link>
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </div>
          <button onClick={onLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}

export default Layout;