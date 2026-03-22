import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import { Upload, RefreshCw, ChevronDown, ChevronUp, Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import ExcelUploader from '../../components/ExcelUploader/ExcelUploader'
import styles from './BuscaroOpsData.module.css'

function BuscaroOpsData({ isAdmin }) {
  const [opsData, setOpsData] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Sort State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  // Google Sheet CSV URL
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

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const res = await fetch(sheetCsvUrl)
        const csvText = await res.text()
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: function(results) {
            setOpsData(results.data)
            localStorage.setItem('buscaroOpsData', JSON.stringify(results.data))
            setLastUpdated(new Date().toLocaleString())
          }
        })
      } catch (err) {
        console.error('Error fetching Google Sheet:', err)
        const saved = localStorage.getItem('buscaroOpsData')
        if (saved) setOpsData(JSON.parse(saved))
      }
    }
    fetchSheetData()
  }, [])

  const handleDataUploaded = (data) => {
    setOpsData(data)
    localStorage.setItem('buscaroOpsData', JSON.stringify(data))
    setShowUpload(false)
    setLastUpdated(new Date().toLocaleString())
  }

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Sort handler - teen states cycle karta hai: null → asc → desc → null
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return { key: null, direction: null }
    })
  }

  // Sort icon return karna
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className={styles.sortIcon} />
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} className={styles.sortIconActive} />
    return <ArrowDown size={14} className={styles.sortIconActive} />
  }

  // Filter + Sort dono apply karna
  const filteredData = useMemo(() => {
    let data = opsData.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )

    if (sortConfig.key && sortConfig.direction) {
      data = [...data].sort((a, b) => {
        const aVal = a[sortConfig.key] || ''
        const bVal = b[sortConfig.key] || ''

        // Number check
        const aNum = parseFloat(aVal)
        const bNum = parseFloat(bVal)
        const isNumeric = !isNaN(aNum) && !isNaN(bNum)

        if (isNumeric) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum
        }

        // String sort
        const comparison = String(aVal).localeCompare(String(bVal))
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return data
  }, [opsData, searchTerm, sortConfig])

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
    { header: 'Captain Mobile', key: 'Captain Personal Mobile' },
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
            <p style={{ fontSize: '12px', color: '#888' }}>Last updated: {lastUpdated}</p>
          )}
        </div>
        {isAdmin && (
          <div className={styles.actions}>
            <button className={styles.updateBtn} onClick={() => setShowUpload(!showUpload)}>
              <RefreshCw size={18} /> Update Data
            </button>
            <button className={styles.exportBtn} onClick={exportToCSV} disabled={opsData.length === 0}>
              <Download size={18} /> Export
            </button>
          </div>
        )}
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
        {sortConfig.key && (
          <div className={styles.stat}>
            <span className={styles.sortActive}>
              Sorted: {sortConfig.key} ({sortConfig.direction === 'asc' ? '↑ A-Z' : '↓ Z-A'})
            </span>
            <button className={styles.clearSort} onClick={() => setSortConfig({ key: null, direction: null })}>
              Clear Sort
            </button>
          </div>
        )}
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
                <th
                  key={col.key}
                  className={styles.sortableHeader}
                  onClick={() => handleSort(col.key)}
                  title={`Sort by ${col.header}`}
                >
                  <div className={styles.headerContent}>
                    {col.header}
                    {getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <>
                <tr key={index} className={styles.mainRow}>
                  <td>
                    <button className={styles.expandBtn} onClick={() => toggleRow(index)}>
                      {expandedRows[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </td>
                  {mainColumns.map(col => (
                    <td key={col.key}>{row[col.key] || '-'}</td>
                  ))}
                </tr>
                {expandedRows[index] && (
                  <tr className={styles.expandedRow}>
                    <td colSpan={mainColumns.length + 1}>
                      <div className={styles.detailsGrid}>
                        {allFields.map(field => (
                          <div key={field} className={styles.detailItem}>
                            <label>{field}</label>
                            <span>{row[field] || '-'}</span>
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

        {filteredData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            No records found
          </div>
        )}
      </div>
    </div>
  )
}

export default BuscaroOpsData