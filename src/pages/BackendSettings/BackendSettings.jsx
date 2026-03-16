import { useState, useEffect } from 'react'
import { Building2, Tags, Users, Shield, ChevronRight } from 'lucide-react'
import DepartmentManager from './DepartmentManager/DepartmentManager'
import CategoryManager from './CategoryManager/CategoryManager'
import RoleManager from './RoleManager/RoleManager'
import styles from './BackendSettings.module.css'

function BackendSettings() {
  const [activeTab, setActiveTab] = useState('departments')

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Building2, desc: 'Manage company departments' },
    { id: 'categories', label: 'Categories', icon: Tags, desc: 'Issue categories & sub-categories' },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, desc: 'Role-based access control' }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Backend Settings</h1>
        <p>Configure system settings, departments, categories and roles</p>
      </div>

      <div className={styles.tabNavigation}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              className={`${styles.tabCard} ${isActive ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className={styles.tabIcon} style={{ background: isActive ? 'var(--accent)' : '#f0f0f0' }}>
                <Icon size={22} color={isActive ? 'white' : '#666'} />
              </div>
              <div className={styles.tabInfo}>
                <h3>{tab.label}</h3>
                <p>{tab.desc}</p>
              </div>
              <ChevronRight size={18} className={styles.arrow} />
            </button>
          )
        })}
      </div>

      <div className={styles.contentArea}>
        {activeTab === 'departments' && <DepartmentManager />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'roles' && <RoleManager />}
      </div>
    </div>
  )
}

export default BackendSettings