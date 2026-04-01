import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import { 
  RefreshCw, ChevronDown, ChevronUp, Search, Download, 
  ArrowUpDown, ArrowUp, ArrowDown, Database, Building2, 
  MapPin, Bus, DollarSign, TrendingUp, Filter, X
} from 'lucide-react'
import ExcelUploader from '../../components/ExcelUploader/ExcelUploader'
import styles from './BuscaroOpsData.module.css'

function Buscaro({ isAdmin }) {
  const [opsData, setOpsData] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [companyFilter, setCompanyFilter] = useState('all')

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

  // Sort handler
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return { key: null, direction: null }
    })
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className={styles.sortIcon} />
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} className={styles.sortIconActive} />
    return <ArrowDown size={14} className={styles.sortIconActive} />
  }

  // Parse numbers helper
  const parseNum = (v) => {
    const n = parseFloat(String(v || '').replace(/,/g, ''))
    return isNaN(n) ? 0 : n
  }

  const fmtShort = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toFixed(0)
  }

  const fmtFull = (n) => `PKR ${Math.round(n).toLocaleString('en-PK')}`

  // Filter + Sort
  const filteredData = useMemo(() => {
    let data = opsData.filter(row => {
      const matchesSearch = Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
      const matchesCompany = companyFilter === 'all' || row['Company'] === companyFilter
      return matchesSearch && matchesCompany
    })

    if (sortConfig.key && sortConfig.direction) {
      data = [...data].sort((a, b) => {
        const aVal = a[sortConfig.key] || ''
        const bVal = b[sortConfig.key] || ''

        const aNum = parseFloat(aVal)
        const bNum = parseFloat(bVal)
        const isNumeric = !isNaN(aNum) && !isNaN(bNum)

        if (isNumeric) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum
        }

        const comparison = String(aVal).localeCompare(String(bVal))
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return data
  }, [opsData, searchTerm, companyFilter, sortConfig])

  // Analytics
  const analytics = useMemo(() => {
    const totalRecords = opsData.length
    const uniqueCompanies = [...new Set(opsData.map(r => r['Company']).filter(Boolean))]
    const uniqueRoutes = [...new Set(opsData.map(r => r['Route Name']).filter(Boolean))]
    const uniqueBuses = [...new Set(opsData.map(r => r['Bus Number']).filter(Boolean))]
    
    const totalRent = opsData.reduce((s, r) => s + parseNum(r['Rent']), 0)
    const totalGMV = opsData.reduce((s, r) => s + parseNum(r['GMV']), 0)
    const totalProfit = totalGMV - totalRent
    const marginPct = totalGMV > 0 ? (totalProfit / totalGMV) * 100 : 0

    return {
      totalRecords,
      companyCount: uniqueCompanies.length,
      routeCount: uniqueRoutes.length,
      busCount: uniqueBuses.length,
      totalRent,
      totalGMV,
      totalProfit,
      marginPct
    }
  }, [opsData])

  const exportToCSV = () => {
    if (!opsData.length) return
    const headers = selectedColumnsSequence.join(',')
    const rows = opsData.map(row =>
      selectedColumnsSequence.map(col => `"${(row[col] || '-').toString().replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buscaro_ops_data_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const uniqueCompanies = useMemo(() => 
    [...new Set(opsData.map(item => item['Company']).filter(Boolean))].sort(),
  [opsData])

  const mainColumns = [
    { header: 'Captain', key: 'Captain Name', width: '140px' },
    { header: 'Company', key: 'Company', width: '120px' },
    { header: 'Route', key: 'Route Name', width: '140px' },
    { header: 'Vendor', key: 'Vendor Name', width: '130px' },
    { header: 'Bus #', key: 'Bus Number', width: '100px' },
    { header: 'Type', key: 'Bus_Type', width: '90px' },
    { header: 'Days', key: 'Rent Days', width: '70px' },
    { header: 'Rent', key: 'Rent', width: '100px', align: 'right' },
    { header: 'GMV', key: 'GMV', width: '100px', align: 'right' },
    { header: 'Margin', key: 'Margin', width: '90px', align: 'right' },
  ]

  const allFields = selectedColumnsSequence.filter(field => field in (opsData[0] || {}))

  return (
    <div className={styles.buscaro}>

      {/* ── TOPBAR ── */}
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Buscaro Ops Data</h1>
          <p className={styles.pageSub}>
            Operations Management • {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading...'}
          </p>
        </div>

        <div className={styles.topbarActions}>
          {isAdmin && (
            <>
              <button 
                className={styles.actionBtn} 
                onClick={() => setShowUpload(!showUpload)}
              >
                <RefreshCw size={16} />
                {showUpload ? 'Cancel' : 'Update Data'}
              </button>
              <button 
                className={styles.exportBtn} 
                onClick={exportToCSV}
                disabled={opsData.length === 0}
              >
                <Download size={16} />
                Export
              </button>
            </>
          )}
        </div>
      </div>


      {/* ── UPLOAD SECTION ── */}
      {showUpload && isAdmin && (
        <div className={styles.sectionCard} style={{ animation: 'slideDown 0.3s ease' }}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <Database size={16} color="#f97316" />
              <h2 className={styles.sectionTitle}>Upload Data</h2>
            </div>
            <button className={styles.closeBtn} onClick={() => setShowUpload(false)}>
              <X size={16} />
            </button>
          </div>
          <ExcelUploader onDataUploaded={handleDataUploaded} />
        </div>
      )}

      {/* ── FILTERS & SEARCH ── */}
      <div className={styles.sectionCard}>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.filterGroup}>
            <Filter size={14} color="#94a3b8" />
            <select 
              value={companyFilter} 
              onChange={(e) => setCompanyFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Companies</option>
              {uniqueCompanies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {sortConfig.key && (
            <div className={styles.sortBadge}>
              <span>Sorted: {sortConfig.key} ({sortConfig.direction === 'asc' ? '↑' : '↓'})</span>
              <button onClick={() => setSortConfig({ key: null, direction: null })}>
                <X size={12} />
              </button>
            </div>
          )}

          <div className={styles.resultsCount}>
            {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className={styles.sectionCard}>
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                {mainColumns.map(col => (
                  <th
                    key={col.key}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    className={styles.sortableHeader}
                    onClick={() => handleSort(col.key)}
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
                      <button 
                        className={`${styles.expandBtn} ${expandedRows[index] ? styles.expandBtnActive : ''}`} 
                        onClick={() => toggleRow(index)}
                      >
                        {expandedRows[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                    {mainColumns.map(col => (
                      <td 
                        key={col.key} 
                        style={{ textAlign: col.align || 'left' }}
                        className={col.align === 'right' ? styles.numericCell : ''}
                      >
                        {col.key === 'Rent' || col.key === 'GMV' ? (
                          <span className={styles.currencyCell}>
                            {row[col.key] ? `PKR ${parseNum(row[col.key]).toLocaleString()}` : '-'}
                          </span>
                        ) : col.key === 'Margin' ? (
                          <span className={`${styles.marginCell} ${parseNum(row[col.key]) < 0 ? styles.negative : ''}`}>
                            {row[col.key] || '-'}
                          </span>
                        ) : (
                          row[col.key] || '-'
                        )}
                      </td>
                    ))}
                  </tr>
                  {expandedRows[index] && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={mainColumns.length + 1}>
                        <div className={styles.expandedContent}>
                          <div className={styles.detailsGrid}>
                            {allFields.map(field => (
                              <div key={field} className={styles.detailItem}>
                                <label>{field}</label>
                                <span>{row[field] || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className={styles.emptyState}>
              <Database size={48} color="#e2e8f0" />
              <p>No records found</p>
              {searchTerm && <span>Try adjusting your search or filters</span>}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Buscaro