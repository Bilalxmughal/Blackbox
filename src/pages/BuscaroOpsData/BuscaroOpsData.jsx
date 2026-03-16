import { useState, useEffect } from 'react'
import ExcelUploader from '../../components/ExcelUploader/ExcelUploader'
import DataTable from '../../components/DataTable/DataTable'
import styles from './BuscaroOpsData.module.css'

function BuscaroOpsData() {
  const [opsData, setOpsData] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('buscaroOpsData')
    if (saved) {
      setOpsData(JSON.parse(saved))
    }
  }, [])

  const handleDataUploaded = (data) => {
    setOpsData(data)
    localStorage.setItem('buscaroOpsData', JSON.stringify(data))
  }

  const columns = [
    { header: 'Captain ID', accessor: 'captainId' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'Captain Name', accessor: 'captainName' },
    { header: 'Bus Number', accessor: 'busNumber' },
    { header: 'Vehicle ID', accessor: 'vehicleId' },
    { header: 'Route Name', accessor: 'routeName' },
    { header: 'Company', accessor: 'company' },
    { header: 'Status', accessor: 'status' },
    { header: 'Contact', accessor: 'captainPersonalMobile' },
    { header: 'CNIC', accessor: 'captainCnic' }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Buscaro Ops Data</h1>
        <p>Upload and manage fleet operations data</p>
      </div>

      <ExcelUploader onDataUploaded={handleDataUploaded} />

      {opsData.length > 0 && (
        <div className={styles.dataSection}>
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{opsData.length}</span>
              <span className={styles.statLabel}>Total Records</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {new Set(opsData.map(d => d.routeName)).size}
              </span>
              <span className={styles.statLabel}>Unique Routes</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {new Set(opsData.map(d => d.vendorName)).size}
              </span>
              <span className={styles.statLabel}>Vendors</span>
            </div>
          </div>

          <DataTable 
            columns={columns}
            data={opsData}
            rowsPerPage={10}
          />
        </div>
      )}
    </div>
  )
}

export default BuscaroOpsData