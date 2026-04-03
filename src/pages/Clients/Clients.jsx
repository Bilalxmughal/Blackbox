import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Building2, Users, MapPin, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, Filter, Download, Eye, Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAllClients, updateClient, deleteClient } from '../../lib/firebase'
import { CLIENT_LOCATIONS, BUSINESS_TYPES, INDUSTRIES,canAddClient,canEditClient,canDeleteClient} from '../../data/clientConfig'
import styles from './Clients.module.css'
import ClientImporter from '../../components/ClientImporter/ClientImporter'


function Clients() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('all')
  const [filterBusinessType, setFilterBusinessType] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showImporter, setShowImporter] = useState(false)
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  // Load clients from Firebase + localStorage
  useEffect(() => {
    const loadClients = async () => {
      setLoading(true)
      try {
        const result = await getAllClients()
        if (result.success) {
          setClients(result.data)
          localStorage.setItem('clients', JSON.stringify(result.data))
        } else {
          const saved = localStorage.getItem('clients')
          if (saved) setClients(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading clients:', error)
        const saved = localStorage.getItem('clients')
        if (saved) setClients(JSON.parse(saved))
      } finally {
        setLoading(false)
      }
    }
    
    loadClients()
    const interval = setInterval(loadClients, 30000)
    return () => clearInterval(interval)
  }, [])

  // Import handler
  const handleImportComplete = (importedClients) => {
    const saved = localStorage.getItem('clients')
    const existing = saved ? JSON.parse(saved) : []
    setClients(existing)
    setShowImporter(false)
  }

  // Save clients helper
  const saveClients = (updated) => {
    setClients(updated)
    localStorage.setItem('clients', JSON.stringify(updated))
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

  // Filtered & Sorted clients
  const filteredClients = useMemo(() => {
    let data = clients.filter(client => {
      const search = searchTerm.toLowerCase()
      const matchesSearch = 
        client.legalName?.toLowerCase().includes(search) ||
        client.clientId?.toLowerCase().includes(search) ||
        client.pocName?.toLowerCase().includes(search) ||
        client.pocEmail?.toLowerCase().includes(search) ||
        client.accountManager?.toLowerCase().includes(search)
      
      const matchesIndustry = filterIndustry === 'all' || client.industry === filterIndustry
      const matchesBusinessType = filterBusinessType === 'all' || client.businessType === filterBusinessType
      const matchesLocation = filterLocation === 'all' || client.location === filterLocation
      
      return matchesSearch && matchesIndustry && matchesBusinessType && matchesLocation
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
  }, [clients, searchTerm, filterIndustry, filterBusinessType, filterLocation, sortConfig])

  // Stats calculation
  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    byBusinessType: {
      b2b: clients.filter(c => c.businessType === 'b2b').length,
      b2c: clients.filter(c => c.businessType === 'b2c').length,
      b2b2c: clients.filter(c => c.businessType === 'b2b2c').length
    },
    byLocation: {
      lahore: clients.filter(c => c.location === 'lahore').length,
      karachi: clients.filter(c => c.location === 'karachi').length,
      islamabad: clients.filter(c => c.location === 'islamabad').length
    }
  }), [clients])

  // Export to CSV
  const exportToCSV = () => {
    if (!clients.length) return
    const headers = ['Client ID', 'Legal Name', 'Industry', 'Location', 'Business Type', 'POC Name', 'POC Email', 'Account Manager', 'Status']
    const rows = filteredClients.map(c => [
      c.clientId, c.legalName, c.industry, c.location, c.businessType,
      c.pocName, c.pocEmail, c.accountManager, c.status
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Delete client handler
  const handleDelete = async (client) => {
    if (!canDeleteClient(currentUser)) {
      alert('Only Super Admin can delete clients!')
      return
    }

    const confirm1 = window.confirm(`⚠️ WARNING: You are about to permanently delete client "${client.legalName}" (${client.clientId}).\n\nThis action cannot be undone.\n\nAre you sure you want to proceed?`)
    if (!confirm1) return

    const userInput = prompt(`Type "DELETE" to permanently remove ${client.legalName}:`)
    if (userInput !== 'DELETE') {
      alert('Delete cancelled. You did not type "DELETE".')
      return
    }

    try {
      if (client.id && !client.id.startsWith('cli-')) {
        await deleteClient(client.id)
      }
      const updated = clients.filter(c => c.id !== client.id)
      saveClients(updated)
      alert('Client deleted successfully!')
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client. Please try again.')
    }
    
    setShowDeleteConfirm(null)
  }

  // Toggle client status
  const toggleStatus = async (client) => {
    if (!canEditClient(currentUser)) {
      alert('You do not have permission to modify clients!')
      return
    }

    const newStatus = client.status === 'active' ? 'inactive' : 'active'
    
    try {
      const updatedClient = { ...client, status: newStatus, updatedAt: new Date().toISOString() }
      
      if (client.id && !client.id.startsWith('cli-')) {
        await updateClient(client.id, { status: newStatus })
      }
      
      const updated = clients.map(c => c.id === client.id ? updatedClient : c)
      saveClients(updated)
    } catch (error) {
      console.error('Error updating client status:', error)
      alert('Failed to update status')
    }
  }

  // Navigate to add client form
  const handleAddClient = () => {
    if (!canAddClient(currentUser)) {
      alert('You do not have permission to add clients!')
      return
    }
    navigate('/clients/new')
  }

  // Navigate to edit client
  const handleEdit = (client) => {
    if (!canEditClient(currentUser)) {
      alert('Only Admin and Super Admin can edit clients!')
      return
    }
    navigate(`/clients/edit/${client.id}`)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  // Get label from value
  const getLabel = (value, options) => {
    return options.find(o => o.value === value)?.label || value
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Client Management</h1>
          <p>Manage all client accounts and information</p>
        </div>
        {canAddClient(currentUser) && (
          <div className={styles.headerActions}>
            <button className={styles.importBtn} onClick={() => setShowImporter(true)}>
              <Upload size={18} /> Bulk Import
            </button>
            <button className={styles.addBtn} onClick={handleAddClient}>
              <Plus size={20} /> Add Client
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Building2 size={24} color="#00d4ff" />
          <div>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Clients</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Users size={24} color="#6bcf7f" />
          <div>
            <span className={styles.statValue}>{stats.active}</span>
            <span className={styles.statLabel}>Active Clients</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.businessTypeStats}>
            <div><span style={{color: '#4d96ff'}}>{stats.byBusinessType.b2b}</span> B2B</div>
            <div><span style={{color: '#9b59b6'}}>{stats.byBusinessType.b2c}</span> B2C</div>
            <div><span style={{color: '#ff8c42'}}>{stats.byBusinessType.b2b2c}</span> B2B2C</div>
          </div>
          <span className={styles.statLabel}>By Business Type</span>
        </div>
        <div className={styles.statCard}>
          <MapPin size={24} color="#ff6b6b" />
          <div className={styles.locationStats}>
            <div>L: {stats.byLocation.lahore}</div>
            <div>K: {stats.byLocation.karachi}</div>
            <div>I: {stats.byLocation.islamabad}</div>
          </div>
          <span className={styles.statLabel}>By Location</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, ID, POC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className={styles.clearSearch}>×</button>
          )}
        </div>
        
        <div className={styles.filterGroup}>
          <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}>
            <option value="all">All Industries</option>
            {INDUSTRIES.map(ind => (
              <option key={ind.value} value={ind.value}>{ind.label}</option>
            ))}
          </select>
          
          <select value={filterBusinessType} onChange={(e) => setFilterBusinessType(e.target.value)}>
            <option value="all">All Business Types</option>
            {BUSINESS_TYPES.map(bt => (
              <option key={bt.value} value={bt.value}>{bt.label}</option>
            ))}
          </select>
          
          <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
            <option value="all">All Locations</option>
            {CLIENT_LOCATIONS.map(loc => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </div>
        
        <button className={styles.exportBtn} onClick={exportToCSV} disabled={!clients.length}>
          <Download size={16} /> Export
        </button>
      </div>

      {/* Active Filters Display */}
      {(filterIndustry !== 'all' || filterBusinessType !== 'all' || filterLocation !== 'all' || searchTerm) && (
        <div className={styles.activeFilters}>
          <span>Active Filters:</span>
          {searchTerm && <span className={styles.filterTag}>Search: {searchTerm}</span>}
          {filterIndustry !== 'all' && <span className={styles.filterTag}>Industry: {getLabel(filterIndustry, INDUSTRIES)}</span>}
          {filterBusinessType !== 'all' && <span className={styles.filterTag}>Type: {getLabel(filterBusinessType, BUSINESS_TYPES)}</span>}
          {filterLocation !== 'all' && <span className={styles.filterTag}>Location: {getLabel(filterLocation, CLIENT_LOCATIONS)}</span>}
          <button className={styles.clearFilters} onClick={() => {
            setSearchTerm('')
            setFilterIndustry('all')
            setFilterBusinessType('all')
            setFilterLocation('all')
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

      {/* Clients Table */}
      <div className={styles.tableContainer}>
        <table className={styles.clientsTable}>
          <thead>
            <tr>
              <th onClick={() => handleSort('clientId')} className={styles.sortable}>
                Client ID {getSortIcon('clientId')}
              </th>
              <th onClick={() => handleSort('legalName')} className={styles.sortable}>
                Legal Name {getSortIcon('legalName')}
              </th>
              <th onClick={() => handleSort('industry')} className={styles.sortable}>
                Industry {getSortIcon('industry')}
              </th>
              <th>Location</th>
              <th>Business Type</th>
              <th>POC Name</th>
              <th>Account Manager</th>
              <th onClick={() => handleSort('status')} className={styles.sortable}>
                Status {getSortIcon('status')}
              </th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id} className={client.status === 'inactive' ? styles.inactiveRow : ''}>
                <td>
                  <span className={styles.clientId}>{client.clientId}</span>
                </td>
                <td>
                  <div className={styles.clientName}>
                    <strong>{client.legalName}</strong>
                    <small>{client.billingAddress?.substring(0, 30)}...</small>
                  </div>
                </td>
                <td>
                  <span className={styles.industryBadge}>
                    {getLabel(client.industry, INDUSTRIES)}
                  </span>
                </td>
                <td>{getLabel(client.location, CLIENT_LOCATIONS)}</td>
                <td>
                  <span className={`${styles.businessBadge} ${styles[client.businessType]}`}>
                    {getLabel(client.businessType, BUSINESS_TYPES)}
                  </span>
                </td>
                <td>
                  <div className={styles.pocInfo}>
                    <span>{client.pocName}</span>
                    <small>{client.pocEmail}</small>
                  </div>
                </td>
                <td>
                  <div className={styles.managerInfo}>
                    <span>{client.accountManager}</span>
                    <small>{client.accountManagerEmail}</small>
                  </div>
                </td>
                <td>
                  <button 
                    className={`${styles.statusToggle} ${styles[client.status]}`}
                    onClick={() => toggleStatus(client)}
                    disabled={!canEditClient(currentUser)}
                  >
                    {client.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className={styles.dateCell}>{formatDate(client.createdAt)}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.viewBtn} 
                      onClick={() => navigate(`/clients/${client.id}`)}
                      title="View Details">
                      <Eye size={16} />
                    </button>
                    
                    {canEditClient(currentUser) && (
                      <button 
                        className={styles.editBtn} 
                        onClick={() => handleEdit(client)}
                        title="Edit Client">
                        <Edit2 size={16} />
                      </button>
                    )}

                    {canDeleteClient(currentUser) && (
                      <button 
                        className={styles.deleteBtn} 
                        onClick={() => setShowDeleteConfirm(client)}
                        title="Delete Client (Super Admin Only)">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div className={styles.emptyState}>
            <AlertCircle size={48} color="#ddd" />
            <p>No clients found</p>
            <span>Try adjusting your filters or add a new client</span>
          </div>
        )}
      </div>

      {/* Importer Modal - TABLE KE BAAD */}
      {showImporter && (
        <div className={styles.modalOverlay} onClick={() => setShowImporter(false)}>
          <div className={styles.importerModal} onClick={e => e.stopPropagation()}>
            <div className={styles.importerHeader}>
              <h2><Upload size={20} /> Import Clients</h2>
              <button onClick={() => setShowImporter(false)}>×</button>
            </div>
            <ClientImporter 
              onImportComplete={handleImportComplete}
              existingClients={clients}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.deleteModalHeader}>
              <AlertCircle size={32} color="#ff6b6b" />
              <h3>⚠️ Super Admin Delete Confirmation</h3>
            </div>
            <div className={styles.deleteModalBody}>
              <p>You are about to permanently delete:</p>
              <div className={styles.deleteTarget}>
                <strong>{showDeleteConfirm.legalName}</strong>
                <span>{showDeleteConfirm.clientId}</span>
              </div>
              <div className={styles.deleteWarning}>
                <p>🔴 This action is <strong>IRREVERSIBLE</strong></p>
                <p>All client data will be permanently removed from the system.</p>
              </div>
              <p className={styles.deleteConfirmText}>
                To confirm, click "Delete Permanently" below.
              </p>
            </div>
            <div className={styles.deleteModalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteBtn} 
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                <Trash2 size={16} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clients