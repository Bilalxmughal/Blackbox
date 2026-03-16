import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import { Upload, RefreshCw, ChevronDown, ChevronUp, Search, Download } from 'lucide-react'
import ExcelUploader from '../../components/ExcelUploader/ExcelUploader'
import styles from './BuscaroOpsData.module.css'

function BuscaroOpsData({ isAdmin }) {
  const [opsData, setOpsData] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Google Sheet CSV URL
  const sheetCsvUrl = 'https://docs.google.com/spreadsheets/d/1mKGwya4kg1Co_hUCPy3MQcpiQBzcMVlhAn3gzqaMaPo/gviz/tq?tqx=out:csv&sheet=Sheet1'

  // Columns to display in custom sequence
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

  // Date formatter function DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      const parts = dateString.split(/[-/]/)
      if (parts.length === 3) {
        const [day, month, year] = parts
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year.length === 2 ? '20' + year : year}`
      }
      return dateString
    }
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}-${month}-${year}`
  }

  // Format date time for display DD-MM-YYYY, 12h format
  const formatDateTime = () => {
    return new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const fetchSheetData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(sheetCsvUrl)
      const csvText = await res.text()
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          setOpsData(results.data)
          localStorage.setItem('buscaroOpsData', JSON.stringify(results.data))
          setLastUpdated(formatDateTime())
          setIsLoading(false)
        },
        error: function(err) {
          console.error('Parse error:', err)
          setIsLoading(false)
        }
      })
    } catch (err) {
      console.error('Error fetching Google Sheet:', err)
      const saved = localStorage.getItem('buscaroOpsData')
      if (saved) setOpsData(JSON.parse(saved))
      setIsLoading(false)
    }
  }, [])

  // Auto-refresh every 1 minute
  useEffect(() => {
    fetchSheetData()
    
    const intervalId = setInterval(() => {
      fetchSheetData()
    }, 60000) // 60000ms = 1 minute

    return () => clearInterval(intervalId)
  }, [fetchSheetData])

  const handleDataUploaded = (data) => {
    setOpsData(data)
    localStorage.setItem('buscaroOpsData', JSON.stringify(data))
    setShowUpload(false)
    setLastUpdated(formatDateTime())
  }

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
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
      selectedColumnsSequence.map(col => {
        let val = row[col] || '-'
        if (col === 'Start Date') val = formatDate(val)
        return `"${val}"`
      }).join(',')
    )
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'buscaro_ops_data.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const uniqueCompanies = [...new Set(opsData.map(item => item.Company).filter(Boolean))]
  const uniqueRoutes = [...new Set(opsData.map(item => item['Route Name']).filter(Boolean))]

  // Main table columns
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

  // Fields to show in expanded details
  const allFields = selectedColumnsSequence.filter(field => field in (opsData[0] || {}))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Buscaro Ops Data</h1>
          {lastUpdated && (
            <p className={styles.lastUpdated}>
              Last updated: {lastUpdated} 
              {isLoading && <span className={styles.loadingDot}>●</span>}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.refreshBtn}
            onClick={fetchSheetData}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? styles.spin : ''} />
            Refresh Data
          </button>

          {isAdmin && (
            <>
              <button
                className={styles.updateBtn}
                onClick={() => setShowUpload(!showUpload)}
              >
                <Upload size={18} />
                Update Data
              </button>

              <button
                className={styles.exportBtn}
                onClick={exportToCSV}
                disabled={opsData.length === 0}
              >
                <Download size={18} />
                Export
              </button>
            </>
          )}
        </div>
      </div>

      {showUpload && isAdmin && (
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
              <>
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
                    <td key={col.key}>
                      {col.key === 'Start Date' 
                        ? formatDate(row[col.key]) 
                        : (row[col.key] || '-')}
                    </td>
                  ))}
                </tr>

                {expandedRows[index] && (
                  <tr key={`expanded-${index}`} className={styles.expandedRow}>
                    <td colSpan={mainColumns.length + 1}>
                      <div className={styles.detailsGrid}>
                        {allFields.map(field => (
                          <div key={field} className={styles.detailItem}>
                            <label>{field}</label>
                            <span>
                              {field === 'Start Date' 
                                ? formatDate(row[field]) 
                                : (row[field] || '-')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BuscaroOpsData