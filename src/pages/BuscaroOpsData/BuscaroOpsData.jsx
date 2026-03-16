import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import { RefreshCw, ChevronDown, ChevronUp, Search, Download } from 'lucide-react'
import ExcelUploader from '../../components/ExcelUploader/ExcelUploader'
import styles from './BuscaroOpsData.module.css'

function BuscaroOpsData({ isAdmin }) {
  const [opsData, setOpsData] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const sheetCsvUrl =
    'https://docs.google.com/spreadsheets/d/1mKGwya4kg1Co_hUCPy3MQcpiQBzcMVlhAn3gzqaMaPo/gviz/tq?tqx=out:csv&sheet=Sheet1'

  const selectedColumnsSequence = [
    'Captain Name',
    'Captain Personal Mobile',
    'Captain CNIC',
    'Company',
    'Route Name',
    'Vendor Name',
    'Vendor Number',
    'Vendor CNIC',
    'Bus Number',
    'Bus_Type',
    'Seats',
    'Mileage',
    'Tracker Status',
    'Tracker Active Status',
    'Rent Days',
    'Rent',
    'GMV',
    'Margin',
    'Comments',
    'Start Date',
    'IBAN'
  ]

  // Format date to DD-MM-YYYY hh:MM AM/PM
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12 // 0 => 12

  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`
}

  // Fetch sheet data
  const fetchSheetData = useCallback(async () => {
    try {
      const res = await fetch(sheetCsvUrl)
      const csvText = await res.text()
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          setOpsData(results.data)
          localStorage.setItem('buscaroOpsData', JSON.stringify(results.data))
          setLastUpdated(new Date())
        }
      })
    } catch (err) {
      console.error('Error fetching Google Sheet:', err)
      const saved = localStorage.getItem('buscaroOpsData')
      if (saved) setOpsData(JSON.parse(saved))
    }
  }, [sheetCsvUrl])

  useEffect(() => {
    fetchSheetData()
    const interval = setInterval(fetchSheetData, 60000) // auto refresh every 1 min
    return () => clearInterval(interval)
  }, [fetchSheetData])

  const handleDataUploaded = (data) => {
    setOpsData(data)
    localStorage.setItem('buscaroOpsData', JSON.stringify(data))
    setShowUpload(false)
    setLastUpdated(new Date())
  }

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredData = opsData.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const exportToCSV = () => {
    if (!opsData.length) return
    const headers = selectedColumnsSequence.join(',')
    const rows = opsData.map(row =>
      selectedColumnsSequence.map(col => row[col] || '-').join(',')
    )
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'buscaro_ops_data.csv'
    a.click()
  }

  const uniqueCompanies = [...new Set(opsData.map(item => item.Company).filter(Boolean))]
  const uniqueRoutes = [...new Set(opsData.map(item => item['Route Name']).filter(Boolean))]

  const mainColumns = [
    { header: 'Captain Name', key: 'Captain Name' },
    { header: 'Captain Personal Mobile', key: 'Captain Personal Mobile' },
    { header: 'Company', key: 'Company' },
    { header: 'Route Name', key: 'Route Name' },
    { header: 'Vendor Name', key: 'Vendor Name' },
    { header: 'Bus Number', key: 'Bus Number' },
    { header: 'Bus Type', key: 'Bus_Type' },
    { header: 'Rent Days', key: 'Rent Days' },
    { header: 'Rent', key: 'Rent' },
    { header: 'GMV', key: 'GMV' },
    { header: 'Margin', key: 'Margin' },
  ]

  const allFields = selectedColumnsSequence.filter(field => field in (opsData[0] || {}))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Buscaro Ops Data</h1>
          {lastUpdated && (
            <p style={{ fontSize: '12px', color: '#888' }}>
              Last updated: {formatDate(lastUpdated)}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.updateBtn} onClick={fetchSheetData}>
            <RefreshCw size={18} />
            Refresh Data
          </button>

          <button
            className={styles.exportBtn}
            onClick={exportToCSV}
            disabled={opsData.length === 0}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {showUpload && (
        <div className={styles.uploadSection}>
          <ExcelUploader onDataUploaded={handleDataUploaded} />
        </div>
      )}

      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{opsData.length}</span>
          <span className={styles.statLabel}>Total Records</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{uniqueCompanies.length}</span>
          <span className={styles.statLabel}>Companies</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{uniqueRoutes.length}</span>
          <span className={styles.statLabel}>Routes</span>
        </div>
      </div>

      <div className={styles.searchBox}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Show</th>
              {mainColumns.map(col => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index} className={styles.mainRow}>
                <td>
                  <button
                    className={styles.expandBtn}
                    onClick={() => toggleRow(index)}
                  >
                    {expandedRows[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </td>
                {mainColumns.map(col => (
                  <td key={col.key}>{row[col.key] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Expanded row details */}
        {filteredData.map((row, index) =>
          expandedRows[index] ? (
            <div key={`expanded-${index}`} className={styles.expandedRow}>
              <div className={styles.detailsGrid}>
                {allFields.map(field => (
                  <div key={field} className={styles.detailItem}>
                    <label>{field}</label>
                    <span>{row[field] || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

export default BuscaroOpsData