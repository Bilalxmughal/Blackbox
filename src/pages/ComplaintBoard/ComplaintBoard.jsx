import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Plus, Search, Eye, MessageSquare, Calendar, User, Building2, X,
  Clock, CheckCircle2, AlertCircle, CheckSquare, Square, 
  ChevronDown, UserCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { 
  COMPLAINT_BY_OPTIONS, TICKET_STATUS, formatDateDDMMYYYY, generateTicketNo 
} from '../../data/complaintConfig'
import { initialCategories } from '../../data/initialCategories'
import { defaultDepartments } from '../../data/users'
import styles from './ComplaintBoard.module.css'
import { useNavigate } from 'react-router-dom'
 
const calculateResolveRatio = (complaint) => {
  if (!complaint) return { ratio: 0, label: 'N/A', color: 'low' }
  const created = new Date(complaint.date)
  const now = new Date()
  const resolved = complaint.ticketStatus === 'Closed'
  const resolvedDate = complaint.resolvedDate ? new Date(complaint.resolvedDate) : now
  const timeDiff = (resolved ? resolvedDate : now) - created
  const hoursDiff = timeDiff / (1000 * 60 * 60)
  const daysDiff = hoursDiff / 24
  if (resolved && hoursDiff <= 24) return { ratio: 100, label: '100%', color: 'high' }
  if (!resolved && hoursDiff <= 24) {
    const ratio = Math.round((hoursDiff / 24) * 100)
    return { ratio, label: `${ratio}%`, color: 'medium' }
  }
  if (resolved) {
    const ratio = Math.max(10, Math.round(100 / daysDiff))
    return { ratio, label: `${ratio}%`, color: ratio >= 50 ? 'medium' : 'low' }
  }
  return { ratio: Math.max(5, Math.round(50 / daysDiff)), label: 'Overdue', color: 'low' }
}
 
function ComplaintBoard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
 
  const [complaints, setComplaints] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [opsData, setOpsData] = useState([])
  const [users, setUsers] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkReassign, setShowBulkReassign] = useState(false)
  const [bulkReassignData, setBulkReassignData] = useState({ dept: '', userId: '', userName: '' })
 
  const [filters, setFilters] = useState({
    search: '', department: 'all', assignedTo: 'all',
    status: 'all', company: 'all', dateFrom: '', dateTo: ''
  })
 
  // ✅ Form State — complaintType + cascading fields added
  const [formData, setFormData] = useState({
    complaintType: '',       // 'new' | 'record'
    routeName: '',           // record flow
    company: '',             // new flow
    vendorName: '',
    captainName: '',
    captainContact: '',
    vendorContact: '',
    busNumber: '',
    assignedDept: '',
    assignedTo: '',
    assignedToName: '',
    issueCategory: '',
    issueCategoryName: '',
    issueSubCategory: '',
    issueSubCategoryName: '',
    issueDetails: '',
    complaintBy: 'client',
    priority: 'medium'
  })
 
  const [isSubmitting, setIsSubmitting] = useState(false)
 
  useEffect(() => {
    const loadData = () => {
      const savedComplaints = localStorage.getItem('complaints')
      setComplaints(savedComplaints ? JSON.parse(savedComplaints) : [])
      const savedCats = localStorage.getItem('categories')
      setCategories(savedCats ? JSON.parse(savedCats) : initialCategories)
      const savedDepts = localStorage.getItem('departments')
      setDepartments(savedDepts ? JSON.parse(savedDepts) : defaultDepartments)
      const savedOps = localStorage.getItem('buscaroOpsData')
      if (savedOps) setOpsData(JSON.parse(savedOps))
      const savedUsers = localStorage.getItem('users')
      setUsers(savedUsers ? JSON.parse(savedUsers) : [])
    }
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  // ✅ RECORD flow: Route → auto-fill everything
  useEffect(() => {
    if (!formData.routeName || formData.complaintType !== 'record' || !opsData.length) return
    const row = opsData.find(item =>
      item['Route Name']?.toString().trim() === formData.routeName.toString().trim()
    )
    if (row) {
      setFormData(prev => ({
        ...prev,
        company: row['Company'] || '',
        vendorName: row['Vendor Name'] || '',
        vendorContact: row['Vendor Number'] || '',
        busNumber: row['Bus Number'] || '',
        captainName: row['Captain Name'] || '',
        captainContact: row['Captain Personal Mobile'] || ''
      }))
    }
  }, [formData.routeName, opsData, formData.complaintType])

  // ✅ NEW flow: Captain selected → auto-fill contact + bus
  useEffect(() => {
    if (!formData.captainName || formData.complaintType !== 'new' || !formData.vendorName) return
    const row = opsData.find(r =>
      r['Captain Name'] === formData.captainName &&
      r['Vendor Name'] === formData.vendorName
    )
    if (row) {
      setFormData(prev => ({
        ...prev,
        captainContact: row['Captain Personal Mobile'] || '',
        busNumber: row['Bus Number'] || '',
        vendorContact: row['Vendor Number'] || ''
      }))
    }
  }, [formData.captainName, formData.vendorName, opsData, formData.complaintType])

  // ✅ Cascading options for NEW flow
  const companyOptions = useMemo(() =>
    [...new Set(opsData.map(r => r['Company']).filter(Boolean))].sort()
  , [opsData])

  const vendorOptions = useMemo(() =>
    formData.company
      ? [...new Set(opsData.filter(r => r['Company'] === formData.company).map(r => r['Vendor Name']).filter(Boolean))].sort()
      : []
  , [formData.company, opsData])

  const captainOptions = useMemo(() =>
    formData.vendorName
      ? [...new Set(opsData.filter(r => r['Vendor Name'] === formData.vendorName).map(r => r['Captain Name']).filter(Boolean))].sort()
      : []
  , [formData.vendorName, opsData])

  const availableUsers = useMemo(() => {
    if (!formData.assignedDept) return []
    return users.filter(u => u.department === formData.assignedDept && u.status === 'active')
  }, [formData.assignedDept, users])
 
  const bulkAvailableUsers = useMemo(() => {
    if (!bulkReassignData.dept) return []
    return users.filter(u => u.department === bulkReassignData.dept && u.status === 'active')
  }, [bulkReassignData.dept, users])
 
  const filterOptions = useMemo(() => {
    const companies = [...new Set(opsData.map(item => item['Company']).filter(Boolean))]
    const deptNames = departments.map(d => d.name)
    const userNames = [...new Set(complaints.map(c => c.assignedTo).filter(Boolean))]
    return { companies, deptNames, userNames }
  }, [opsData, departments, complaints])
 
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const search = filters.search.toLowerCase()
      const matchesSearch =
        c.ticketNo?.toLowerCase().includes(search) ||
        c.routeName?.toLowerCase().includes(search) ||
        c.captainName?.toLowerCase().includes(search) ||
        c.issueDetails?.toLowerCase().includes(search) ||
        c.comments?.some(cm => cm.text?.toLowerCase().includes(search))
      const matchesDept = filters.department === 'all' || c.assignedDept === filters.department
      const matchesUser = filters.assignedTo === 'all' || c.assignedTo === filters.assignedTo
      const matchesStatus = filters.status === 'all' || c.ticketStatus === filters.status
      const matchesCompany = filters.company === 'all' || c.company === filters.company
      let matchesDate = true
      if (filters.dateFrom) matchesDate = new Date(c.date) >= new Date(filters.dateFrom)
      if (filters.dateTo && matchesDate) matchesDate = new Date(c.date) <= new Date(filters.dateTo)
      return matchesSearch && matchesDept && matchesUser && matchesStatus && matchesCompany && matchesDate
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [complaints, filters])
 
  const myStats = useMemo(() => {
    const myTickets = complaints.filter(c => c.submittedById === currentUser?.id)
    return {
      myTotal: myTickets.length,
      myOpen: myTickets.filter(c => c.ticketStatus === 'Open').length,
      myInProgress: myTickets.filter(c => c.ticketStatus === 'In Progress').length,
      myClosed: myTickets.filter(c => c.ticketStatus === 'Closed').length
    }
  }, [complaints, currentUser])
 
  const saveComplaints = useCallback((updated) => {
    setComplaints(updated)
    localStorage.setItem('complaints', JSON.stringify(updated))
  }, [])
 
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredComplaints.length) setSelectedIds([])
    else setSelectedIds(filteredComplaints.map(c => c.id))
  }
  const clearSelection = () => {
    setSelectedIds([])
    setShowBulkReassign(false)
    setBulkReassignData({ dept: '', userId: '', userName: '' })
  }
 
  const handleBulkClose = () => {
    if (!selectedIds.length) return
    const confirmed = window.confirm(`Are you sure you want to close ${selectedIds.length} ticket(s)?`)
    if (!confirmed) return
    const updated = complaints.map(c => {
      if (!selectedIds.includes(c.id)) return c
      return {
        ...c, ticketStatus: 'Closed', complaintStatus: 'Resolved',
        resolvedPercent: 100, resolvedDate: new Date().toISOString(),
        activityLog: [...(c.activityLog || []), {
          id: `act-${Date.now()}`, type: 'status_change',
          text: `Ticket bulk-closed by Admin ${currentUser?.name}`,
          by: currentUser?.name, timestamp: new Date().toISOString()
        }]
      }
    })
    saveComplaints(updated)
    clearSelection()
  }
 
  const handleBulkReassign = () => {
    if (!bulkReassignData.dept || !bulkReassignData.userId) {
      alert('Please select department and user'); return
    }
    const updated = complaints.map(c => {
      if (!selectedIds.includes(c.id)) return c
      return {
        ...c,
        assignedDept: bulkReassignData.dept,
        assignedTo: bulkReassignData.userName,
        assignedToId: bulkReassignData.userId,
        assignedToName: bulkReassignData.userName,
        reassignHistory: [...(c.reassignHistory || []), {
          id: `reas-${Date.now()}`, fromUser: c.assignedTo, fromUserId: c.assignedToId,
          toUser: bulkReassignData.userName, toUserId: bulkReassignData.userId,
          toDept: bulkReassignData.dept,
          reason: `Bulk reassigned by Admin ${currentUser?.name}`,
          reassignedBy: currentUser?.name, reassignedById: currentUser?.id,
          timestamp: new Date().toISOString()
        }],
        activityLog: [...(c.activityLog || []), {
          id: `act-${Date.now()}`, type: 'reassign',
          text: `Bulk reassigned to "${bulkReassignData.userName}" (${bulkReassignData.dept}) by Admin ${currentUser?.name}`,
          by: currentUser?.name, timestamp: new Date().toISOString()
        }]
      }
    })
    saveComplaints(updated)
    clearSelection()
  }
 
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (!formData.assignedTo || !formData.assignedToName) {
        alert('Please select a user to assign this complaint')
        setIsSubmitting(false)
        return
      }
      const category = categories.find(c => c.id === formData.issueCategory)
      const ticketNo = generateTicketNo(category?.code || 'GEN', new Date().toISOString())
      const newComplaint = {
        id: `comp-${Date.now()}`,
        ticketNo,
        date: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser?.name || 'System',
        submittedById: currentUser?.id,
        complaintType: formData.complaintType,
        routeName: formData.routeName,
        company: formData.company,
        vendorName: formData.vendorName,
        vendorContact: formData.vendorContact,
        busNumber: formData.busNumber,
        captainName: formData.captainName,
        captainContact: formData.captainContact,
        assignedDept: formData.assignedDept,
        assignedTo: formData.assignedToName,
        assignedToId: formData.assignedTo,
        assignedToName: formData.assignedToName,
        issueCategory: formData.issueCategory,
        issueCategoryName: formData.issueCategoryName || category?.name,
        issueSubCategory: formData.issueSubCategory,
        issueSubCategoryName: formData.issueSubCategoryName,
        issueDetails: formData.issueDetails,
        complaintBy: formData.complaintBy,
        priority: formData.priority,
        ticketStatus: 'Open',
        complaintStatus: 'Pending',
        resolvedPercent: 0,
        comments: [],
        activityLog: [{
          id: `act-${Date.now()}`, type: 'created',
          text: `Ticket created by ${currentUser?.name} and assigned to ${formData.assignedToName}`,
          by: currentUser?.name, timestamp: new Date().toISOString()
        }]
      }
      saveComplaints([newComplaint, ...complaints])
      resetForm()
      setShowAddModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }
 
  const resetForm = () => {
    setFormData({
      complaintType: '', routeName: '', company: '', vendorName: '',
      captainName: '', captainContact: '', vendorContact: '', busNumber: '',
      assignedDept: '', assignedTo: '', assignedToName: '',
      issueCategory: '', issueCategoryName: '', issueSubCategory: '',
      issueSubCategoryName: '', issueDetails: '', complaintBy: 'client', priority: 'medium'
    })
  }

  // ✅ Complaint type change → reset route/company fields
  const handleComplaintTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      complaintType: type,
      routeName: '', company: '', vendorName: '', captainName: '',
      captainContact: '', vendorContact: '', busNumber: ''
    }))
  }
 
  const openDetail = (complaint) => navigate(`/complaints/${complaint.id}`)
  const uniqueRoutes = useMemo(() =>
    [...new Set(opsData.map(item => item['Route Name']).filter(Boolean))].sort()
  , [opsData])
  const allFilteredSelected = filteredComplaints.length > 0 && filteredComplaints.every(c => selectedIds.includes(c.id))
  const isNew = formData.complaintType === 'new'
  const isRecord = formData.complaintType === 'record'
 
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Complaint Board</h1>
          <p>Manage and track all complaints & tickets</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Add Complaint
        </button>
      </div>
 
      <div className={styles.statsSection}>
        <h3>My Tickets Overview</h3>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.myTickets}`}>
            <User size={24} color="#00d4ff" />
            <div><span className={styles.statValue}>{myStats.myTotal}</span><span className={styles.statLabel}>Total Submitted</span></div>
          </div>
          <div className={styles.statCard}>
            <AlertCircle size={24} color="#ff6b6b" />
            <div><span className={styles.statValue}>{myStats.myOpen}</span><span className={styles.statLabel}>My Open</span></div>
          </div>
          <div className={styles.statCard}>
            <Clock size={24} color="#ffa726" />
            <div><span className={styles.statValue}>{myStats.myInProgress}</span><span className={styles.statLabel}>My In Progress</span></div>
          </div>
          <div className={styles.statCard}>
            <CheckCircle2 size={24} color="#66bb6a" />
            <div><span className={styles.statValue}>{myStats.myClosed}</span><span className={styles.statLabel}>My Closed</span></div>
          </div>
        </div>
      </div>
 
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input type="text" placeholder="Search tickets, comments..." value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})} />
        </div>
        <div className={styles.filterGroup}>
          <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})}>
            <option value="all">All Departments</option>
            {filterOptions.deptNames.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.assignedTo} onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}>
            <option value="all">All Users</option>
            {filterOptions.userNames.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="all">All Status</option>
            {Object.values(TICKET_STATUS).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <div className={styles.secondaryFilters}>
        <div className={styles.dateFilter}>
          <Calendar size={16} />
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
          <span>to</span>
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
        </div>
        <div className={styles.companyFilter}>
          <Building2 size={16} color="#666" />
          <select value={filters.company} onChange={(e) => setFilters({...filters, company: e.target.value})}>
            <option value="all">All Companies</option>
            {filterOptions.companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
        </div>

        <button className={styles.clearBtn} onClick={() => setFilters({
          search: '', department: 'all', assignedTo: 'all', status: 'all', company: 'all', dateFrom: '', dateTo: ''
        })}>Clear</button>
      </div>
 
      
 
      <div className={styles.tableContainer}>
        <table className={styles.complaintsTable}>
          <thead>
            <tr>
              {isAdmin && (
                <th className={styles.checkboxCol}>
                  <button className={styles.checkboxBtn} onClick={toggleSelectAll}>
                    {allFilteredSelected ? <CheckSquare size={18} color="#00d4ff" /> : <Square size={18} color="#aaa" />}
                  </button>
                </th>
              )}
              <th>Date</th><th>Ticket No</th><th>Route</th><th>Category</th>
              <th>Sub Issue</th><th>Department</th><th>Assigned To</th>
              <th>Source</th><th>Status</th><th>Resolve Ratio</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.map(complaint => {
              const ratio = calculateResolveRatio(complaint)
              const isSelected = selectedIds.includes(complaint.id)
              return (
                <tr key={complaint.id} className={isSelected ? styles.selectedRow : ''}>
                  {isAdmin && (
                    <td className={styles.checkboxCol}>
                      <button className={styles.checkboxBtn} onClick={() => toggleSelect(complaint.id)}>
                        {isSelected ? <CheckSquare size={18} color="#00d4ff" /> : <Square size={18} color="#ccc" />}
                      </button>
                    </td>
                  )}
                  <td className={styles.dateCell}>{formatDateDDMMYYYY(complaint.date)}</td>
                  <td className={styles.ticketCell}><span className={styles.ticketNo}>{complaint.ticketNo}</span></td>
                  <td>{complaint.routeName || complaint.vendorName || '-'}</td>
                  <td><span className={styles.categoryBadge}>{complaint.issueCategoryName || complaint.issueCategory}</span></td>
                  <td>{complaint.issueSubCategoryName || '-'}</td>
                  <td>{complaint.assignedDept}</td>
                  <td><div className={styles.assignedCell}><User size={14} />{complaint.assignedTo || '-'}</div></td>
                  <td>
                    <span className={`${styles.sourceBadge} ${styles[complaint.complaintBy]}`}>
                      {COMPLAINT_BY_OPTIONS.find(o => o.value === complaint.complaintBy)?.label || 'Client'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[complaint.ticketStatus?.replace(' ', '').toLowerCase()]}`}>
                      {complaint.ticketStatus}
                    </span>
                  </td>
                  <td>
                    <div className={styles.resolveRatio}>
                      <div className={styles.ratioBar}>
                        <div className={`${styles.ratioFill} ${styles[ratio.color]}`} style={{ width: `${ratio.ratio}%` }} />
                      </div>
                      <span className={styles.ratioText}>{ratio.label}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={styles.viewBtn} onClick={() => openDetail(complaint)}><Eye size={16} /></button>
                      <button className={styles.commentBtn} onClick={() => openDetail(complaint)}>
                        <MessageSquare size={16} />
                        {complaint.comments?.length > 0 && <span className={styles.commentCount}>{complaint.comments.length}</span>}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredComplaints.length === 0 && (
          <div className={styles.emptyState}>
            <AlertCircle size={48} color="#ddd" />
            <p>No complaints found</p>
            <span>Try adjusting filters or add a new complaint</span>
          </div>
        )}
      </div>
 
      {isAdmin && selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkLeft}>
            <span className={styles.bulkCount}><CheckSquare size={18} color="#00d4ff" />{selectedIds.length} ticket{selectedIds.length > 1 ? 's' : ''} selected</span>
            <button className={styles.bulkClearBtn} onClick={clearSelection}><X size={16} /> Deselect All</button>
          </div>
          <div className={styles.bulkActions}>
            <button className={styles.bulkCloseBtn} onClick={handleBulkClose}><CheckCircle2 size={16} /> Close All</button>
            <button className={styles.bulkReassignBtn} onClick={() => setShowBulkReassign(!showBulkReassign)}>
              <UserCheck size={16} /> Reassign All <ChevronDown size={14} />
            </button>
          </div>
          {showBulkReassign && (
            <div className={styles.bulkReassignDropdown}>
              <select value={bulkReassignData.dept} onChange={(e) => setBulkReassignData({ dept: e.target.value, userId: '', userName: '' })}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              <select value={bulkReassignData.userId} onChange={(e) => {
                const u = bulkAvailableUsers.find(u => u.id === e.target.value)
                setBulkReassignData(prev => ({ ...prev, userId: e.target.value, userName: u?.name || '' }))
              }} disabled={!bulkReassignData.dept}>
                <option value="">Select User</option>
                {bulkAvailableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button className={styles.bulkReassignConfirm} onClick={handleBulkReassign} disabled={!bulkReassignData.dept || !bulkReassignData.userId}>
                <UserCheck size={15} /> Confirm Reassign
              </button>
            </div>
          )}
        </div>
      )}
 
      {/* ✅ ADD COMPLAINT MODAL */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={(e) => { if(e.target === e.currentTarget) { resetForm(); setShowAddModal(false) } }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><Plus size={20} /> Add New Complaint</h2>
              <button className={styles.closeBtn} onClick={() => { resetForm(); setShowAddModal(false) }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>

              {/* ── STEP 1: Complaint Type ── */}
              <div className={styles.formSection}>
                <div className={styles.formSectionLabel}>Complaint Type *</div>
                <div className={styles.typeToggle}>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${isNew ? styles.typeBtnNew : ''}`}
                    onClick={() => handleComplaintTypeChange('new')}
                  >
                    Company Type
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${isRecord ? styles.typeBtnRecord : ''}`}
                    onClick={() => handleComplaintTypeChange('record')}
                  >
                    Route Type
                  </button>
                </div>
              </div>

              {/* ── No type selected placeholder ── */}
              {!formData.complaintType && (
                <div className={styles.typePlaceholder}>
                  Select complaint type to continue ↑
                </div>
              )}

              {/* ── RECORD flow: Route ── */}
              {isRecord && (
                <div className={styles.formSection}>
                  <div className={styles.formSectionLabel}>Route Information</div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Route Name *</label>
                      <select value={formData.routeName} onChange={(e) => setFormData({...formData, routeName: e.target.value})} required>
                        <option value="">Select Route</option>
                        {uniqueRoutes.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    
                  </div>
                  {formData.routeName && (
                    <div className={styles.formRow3}>
                      <div className={styles.formGroup}>
                        <label>Vendor Name</label>
                        <input type="text" value={formData.vendorName} readOnly className={styles.readOnly} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Vendor Contact</label>
                        <input type="text" value={formData.vendorContact} readOnly className={styles.readOnly} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Bus Number</label>
                        <input type="text" value={formData.busNumber} readOnly className={styles.readOnly} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Captain Name</label>
                        <input type="text" value={formData.captainName} readOnly className={styles.readOnly} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Captain Contact</label>
                        <input type="text" value={formData.captainContact} readOnly className={styles.readOnly} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── NEW flow: Company → Vendor → Captain ── */}
              {isNew && (
                <div className={styles.formSection}>
                  <div className={styles.formSectionLabel}>Route Information</div>
                  <div className={styles.formRow3}>
                    {/* Company */}
                    <div className={styles.formGroup}>
                      <label>Company *</label>
                      <select
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({
                          ...prev, company: e.target.value,
                          vendorName: '', captainName: '', captainContact: '', busNumber: '', vendorContact: ''
                        }))}
                        required
                      >
                        <option value="">Select Company</option>
                        {companyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Vendor */}
                    <div className={styles.formGroup}>
                      <label>Vendor Name *</label>
                      <select
                        value={formData.vendorName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev, vendorName: e.target.value,
                          captainName: '', captainContact: '', busNumber: '', vendorContact: ''
                        }))}
                        disabled={!formData.company}
                        required
                      >
                        <option value="">{formData.company ? 'Select Vendor' : 'Select Company first'}</option>
                        {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>

                    {/* Captain */}
                    <div className={styles.formGroup}>
                      <label>Captain / Driver *</label>
                      <select
                        value={formData.captainName}
                        onChange={(e) => setFormData(prev => ({ ...prev, captainName: e.target.value }))}
                        disabled={!formData.vendorName}
                        required
                      >
                        <option value="">{formData.vendorName ? 'Select Captain' : 'Select Vendor first'}</option>
                        {captainOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Auto-filled row */}
                  {formData.captainName && (
                    <div className={styles.formRow3} style={{ marginTop: 14 }}>
                      <div className={styles.formGroup}>
                        <label>Captain Contact</label>
                        <input type="text" value={formData.captainContact} readOnly className={styles.readOnly} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Vendor Contact</label>
                        <input type="text" value={formData.vendorContact} readOnly className={styles.readOnly} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Bus Number</label>
                        <input type="text" value={formData.busNumber} readOnly className={styles.readOnly} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Issue + Assignment (show when type selected) ── */}
              {formData.complaintType && (
                <>
                  <div className={styles.formSection}>
                    <div className={styles.formSectionLabel}>Issue Information</div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Complaint By *</label>
                        <select value={formData.complaintBy} onChange={(e) => setFormData({...formData, complaintBy: e.target.value})} required>
                          {COMPLAINT_BY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Priority</label>
                        <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.formRow} style={{ marginTop: 14 }}>
                      <div className={styles.formGroup}>
                        <label>Issue Category *</label>
                        <select value={formData.issueCategory} onChange={(e) => {
                          const cat = categories.find(c => c.id === e.target.value)
                          setFormData({...formData, issueCategory: e.target.value, issueCategoryName: cat?.name, issueSubCategory: '', issueSubCategoryName: ''})
                        }} required>
                          <option value="">Select Category</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Sub Category *</label>
                        <select value={formData.issueSubCategory} onChange={(e) => {
                          const subCat = categories.find(c => c.id === formData.issueCategory)?.subCategories?.find(s => s.id === e.target.value)
                          setFormData({...formData, issueSubCategory: e.target.value, issueSubCategoryName: subCat?.name})
                        }} required disabled={!formData.issueCategory}>
                          <option value="">Select Sub-Category</option>
                          {categories.find(c => c.id === formData.issueCategory)?.subCategories?.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <div className={styles.formSectionLabel}>Assignment</div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Assign Department *</label>
                        <select value={formData.assignedDept} onChange={(e) => setFormData({...formData, assignedDept: e.target.value, assignedTo: '', assignedToName: ''})} required>
                          <option value="">Select Department</option>
                          {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Assign To *</label>
                        <select value={formData.assignedTo} onChange={(e) => {
                          const selectedUser = availableUsers.find(u => u.id === e.target.value)
                          setFormData({...formData, assignedTo: e.target.value, assignedToName: selectedUser?.name})
                        }} required disabled={!formData.assignedDept}>
                          <option value="">Select User</option>
                          {availableUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                        {formData.assignedDept && availableUsers.length === 0 && <small className={styles.noUsers}>No active users in this department</small>}
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label>Issue Details *</label>
                    <textarea rows="4" value={formData.issueDetails}
                      onChange={(e) => setFormData({...formData, issueDetails: e.target.value})}
                      placeholder="Describe the issue in detail..." required />
                  </div>

                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => { resetForm(); setShowAddModal(false) }}>Cancel</button>
                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Ticket'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
export default ComplaintBoard