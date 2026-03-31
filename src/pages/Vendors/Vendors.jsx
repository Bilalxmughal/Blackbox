import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Truck, Phone, CreditCard, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, Download, Eye } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { VENDOR_STATUS, FILER_STATUS, canAddVendor, canEditVendor, canDeleteVendor } from '../../data/vendorConfig'
import styles from './Vendors.module.css'

function Vendors() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  // Load vendors
  useEffect(() => {
    const loadVendors = () => {
      const saved = localStorage.getItem('vendors')
      if (saved) {
        setVendors(JSON.parse(saved))
      }
      setLoading(false)
    }
    loadVendors()
  }, [])

  const saveVendors = (updated) => {
    setVendors(updated)
    localStorage.setItem('vendors', JSON.stringify(updated))
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

  // Filtered & Sorted
  const filteredVendors = useMemo(() => {
    let data = vendors.filter(v => {
      const search = searchTerm.toLowerCase()
      const matchesSearch = 
        v.name?.toLowerCase().includes(search) ||
        v.phone?.includes(search) ||
        v.cnic?.includes(search) ||
        v.bankName?.toLowerCase().includes(search)
      
      const matchesStatus = filterStatus === 'all' || v.vendorStatus === filterStatus
      
      return matchesSearch && matchesStatus
    })

    if (sortConfig.key && sortConfig.direction) {
      data = [...data].sort((a, b) => {
        const aVal = a[sortConfig.key] || ''
        const bVal = b[sortConfig.key] || ''
        const comparison = String(aVal).localeCompare(String(bVal))
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return data
  }, [vendors, searchTerm, filterStatus, sortConfig])

  // Stats
  const stats = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter(v => v.vendorStatus === 'active').length,
    inactive: vendors.filter(v => v.vendorStatus === 'inactive').length,
    filerYes: vendors.filter(v => v.filerStatus === 'yes').length,
    filerNo: vendors.filter(v => v.filerStatus === 'no').length
  }), [vendors])

  // Export CSV
  const exportToCSV = () => {
    if (!vendors.length) return
    const headers = ['Vendor ID', 'Name', 'Phone', 'CNIC', 'Filer Status', 'Vendor Status', 'Bank Name', 'Account Title', 'Account Number']
    const rows = filteredVendors.map(v => [
      v.vendorId, v.name, '+92 ' + v.phone, v.cnic, 
      v.filerStatus === 'yes' ? 'Yes' : 'No',
      v.vendorStatus === 'active' ? 'Active' : 'Non Active',
      v.bankName, v.accountTitle, v.accountNumber
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendors_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Delete handler
  const handleDelete = (vendor) => {
    if (!canDeleteVendor(currentUser)) {
      alert('Only Super Admin can delete vendors!')
      return
    }

    const confirm1 = window.confirm(`⚠️ Delete vendor "${vendor.name}"?\n\nThis cannot be undone.`)
    if (!confirm1) return

    const userInput = prompt(`Type "DELETE" to confirm:`)
    if (userInput !== 'DELETE') {
      alert('Cancelled')
      return
    }

    const updated = vendors.filter(v => v.id !== vendor.id)
    saveVendors(updated)
    alert('Vendor deleted!')
    setShowDeleteConfirm(null)
  }

  // Toggle vendor status
  const toggleStatus = (vendor) => {
    if (!canEditVendor(currentUser)) {
      alert('No permission!')
      return
    }

    const newStatus = vendor.vendorStatus === 'active' ? 'inactive' : 'active'
    const updated = vendors.map(v => 
      v.id === vendor.id ? { ...v, vendorStatus: newStatus, updatedAt: new Date().toISOString() } : v
    )
    saveVendors(updated)
  }

  const handleAdd = () => {
    if (!canAddVendor(currentUser)) {
      alert('No permission to add vendors!')
      return
    }
    navigate('/vendors/new')
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const getStatusLabel = (value) => {
    return VENDOR_STATUS.find(s => s.value === value)?.label || value
  }

  const getFilerLabel = (value) => {
    return FILER_STATUS.find(s => s.value === value)?.label || value
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Vendor Management</h1>
          <p>Manage transport vendors and bank details</p>
        </div>
        {canAddVendor(currentUser) && (
          <button className={styles.addBtn} onClick={handleAdd}>
            <Plus size={20} /> Add Vendor
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Truck size={24} color="#00d4ff" />
          <div>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Vendors</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statusDot} style={{background: '#6bcf7f'}} />
          <div>
            <span className={styles.statValue}>{stats.active}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statusDot} style={{background: '#ff6b6b'}} />
          <div>
            <span className={styles.statValue}>{stats.inactive}</span>
            <span className={styles.statLabel}>Non Active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.filerBadge}>Filer</div>
          <div>
            <span className={styles.statValue}>{stats.filerYes}</span>
            <span className={styles.statLabel}>Yes / {stats.filerNo} No</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, CNIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className={styles.clearSearch}>×</button>
          )}
        </div>
        
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.filterSelect}>
          <option value="all">All Vendor Status</option>
          {VENDOR_STATUS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        
        <button className={styles.exportBtn} onClick={exportToCSV} disabled={!vendors.length}>
          <Download size={16} /> Export
        </button>
      </div>

      {/* Active Filters */}
      {(filterStatus !== 'all' || searchTerm) && (
        <div className={styles.activeFilters}>
          <span>Active Filters:</span>
          {searchTerm && <span className={styles.filterTag}>Search: {searchTerm}</span>}
          {filterStatus !== 'all' && <span className={styles.filterTag}>Status: {getStatusLabel(filterStatus)}</span>}
          <button className={styles.clearFilters} onClick={() => {
            setSearchTerm('')
            setFilterStatus('all')
          }}>Clear All</button>
        </div>
      )}

      {/* Sort Info */}
      {sortConfig.key && (
        <div className={styles.sortInfo}>
          Sorted by: <strong>{sortConfig.key}</strong> ({sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A'})
          <button onClick={() => setSortConfig({ key: null, direction: null })}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.vendorsTable}>
          <thead>
            <tr>
              <th onClick={() => handleSort('vendorId')} className={styles.sortable}>
                Vendor ID {getSortIcon('vendorId')}
              </th>
              <th onClick={() => handleSort('name')} className={styles.sortable}>
                Vendor Name {getSortIcon('name')}
              </th>
              <th>Contact</th>
              <th>CNIC</th>
              <th>Filer</th>
              <th>Bank Details</th>
              <th onClick={() => handleSort('vendorStatus')} className={styles.sortable}>
                Status {getSortIcon('vendorStatus')}
              </th>
              <th>Documents</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map(vendor => (
              <tr key={vendor.id} className={vendor.vendorStatus === 'inactive' ? styles.inactiveRow : ''}>
                <td>
                  <span className={styles.vendorId}>{vendor.vendorId}</span>
                </td>
                <td>
                  <div className={styles.vendorName}>
                    <strong>{vendor.name}</strong>
                  </div>
                </td>
                <td>
                  <div className={styles.contactInfo}>
                    <Phone size={14} />
                    <span>+92 {vendor.phone}</span>
                  </div>
                </td>
                <td>
                  <span className={styles.cnicBadge}>{vendor.cnic}</span>
                </td>
                <td>
                  <span className={`${styles.filerTag} ${vendor.filerStatus}`}>
                    {getFilerLabel(vendor.filerStatus)}
                  </span>
                </td>
                <td>
                  <div className={styles.bankInfo}>
                    <small>{vendor.bankName}</small>
                    <span>{vendor.accountTitle}</span>
                  </div>
                </td>
                <td>
                  <button 
                    className={`${styles.statusToggle} ${styles[vendor.vendorStatus]}`}
                    onClick={() => toggleStatus(vendor)}
                    disabled={!canEditVendor(currentUser)}
                  >
                    {getStatusLabel(vendor.vendorStatus)}
                  </button>
                </td>
                <td>
                  <div className={styles.docBadges}>
                    {vendor.cnicFront && <span className={styles.docBadge}>CNIC Front ✓</span>}
                    {vendor.cnicBack && <span className={styles.docBadge}>CNIC Back ✓</span>}
                  </div>
                </td>
                <td className={styles.dateCell}>{formatDate(vendor.createdAt)}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.viewBtn} 
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {canEditVendor(currentUser) && (
                      <button 
                        className={styles.editBtn} 
                        onClick={() => navigate(`/vendors/edit/${vendor.id}`)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    
                    {canDeleteVendor(currentUser) && (
                      <button 
                        className={styles.deleteBtn} 
                        onClick={() => setShowDeleteConfirm(vendor)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVendors.length === 0 && (
          <div className={styles.emptyState}>
            <Truck size={48} color="#ddd" />
            <p>No vendors found</p>
            <span>Add a new vendor to get started</span>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.deleteModalHeader}>
              <AlertCircle size={32} color="#ff6b6b" />
              <h3>⚠️ Delete Vendor</h3>
            </div>
            <div className={styles.deleteModalBody}>
              <p>Delete <strong>{showDeleteConfirm.name}</strong>?</p>
              <p className={styles.warning}>This action cannot be undone.</p>
            </div>
            <div className={styles.deleteModalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(showDeleteConfirm)}>
                <Trash2 size={16} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vendors