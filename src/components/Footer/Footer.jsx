import styles from './Footer.module.css'

function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLeft}>
          <span className={styles.brand}>BusCaro - BlackBox</span>
          <span className={styles.separator}>|</span>
          <span className={styles.version}>v1.0.0</span>
        </div>
        
        <div className={styles.footerCenter}>
          <p>CRM System for Fleet Management</p>
        </div>
        
        <div className={styles.footerRight}>
          <span>© {currentYear} All Rights Reserved</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer