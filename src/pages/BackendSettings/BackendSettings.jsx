import { useState } from 'react'
import IssueCategories from './IssueCategories/IssueCategories'
import SubCategories from './SubCategories/SubCategories'
import styles from './BackendSettings.module.css'

function BackendSettings() {
  const [activeTab, setActiveTab] = useState('categories')

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Backend Settings</h1>
        <p>Manage categories and configurations</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Issue Categories
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'subcategories' ? styles.active : ''}`}
          onClick={() => setActiveTab('subcategories')}
        >
          Sub-Categories & Users
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'categories' && <IssueCategories />}
        {activeTab === 'subcategories' && <SubCategories />}
      </div>
    </div>
  )
}

export default BackendSettings