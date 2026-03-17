import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Eye, 
  MessageSquare, 
  Calendar,
  User,
  Building2,
  X,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { 
  COMPLAINT_BY_OPTIONS, 
  TICKET_STATUS, 
  formatDateDDMMYYYY,
  generateTicketNo 
} from '../../data/complaintConfig'
import { initialCategories } from '../../data/initialCategories'
import { defaultDepartments } from '../../data/users'
import styles from './ComplaintBoard.module.css'

// Calculate resolve ratio based on time
const calculateResolveRatio = (complaint) => {
  if (!complaint) return { ratio: 0, label: 'N/A', color: 'low' }
  
  const created = new Date(complaint.date)
  const now = new Date()
  const resolved = complaint.ticketStatus === 'Closed'
  const resolvedDate = complaint.resolvedDate ? new Date(complaint.resolvedDate) : now
  
  const timeDiff = (resolved ? resolvedDate : now) - created
  const hoursDiff = timeDiff / (1000 * 60 * 60)
  const daysDiff = hoursDiff / 24
  
  if (resolved && hoursDiff <= 24) {
    return { ratio: 100, label: '100%', color: 'high' }
  }
  
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
  
  // Data States
  const [complaints, setComplaints] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [opsData, setOpsData] = useState([])
  const [users, setUsers] = useState([])
  
  // UI States
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  
  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    assignedTo: 'all',
    status: 'all',
    company: 'all',
    dateFrom: '',
    dateTo: ''
  })
  
  // Form State
  const [formData, setFormData] = useState({
    routeName: '',
    accountName: '',
    vendorName: '',
    captainName: '',
    captainContact: '',
    company: '',
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
  
  // Comment State
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load all data
  useEffect(() => {
    const loadData = () => {
      const savedComplaints = localStorage.getItem('complaints')
      setComplaints(savedComplaints ? JSON.parse(savedComplaints) : [])
      
      const savedCats = localStorage.getItem('categories')
      setCategories(savedCats ? JSON.parse(savedCats) : initialCategories)
      
      const savedDepts = localStorage.getItem('departments')
      setDepartments(savedDepts ? JSON.parse(savedDepts) : defaultDepartments)
      
      const savedOps = localStorage.getItem('buscaroOpsData')
      if (savedOps) {
        setOpsData(JSON.parse(savedOps))
      }
      
      const savedUsers = localStorage.getItem('users')
      setUsers(savedUsers ? JSON.parse(savedUsers) : [])
    }
    
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-fill from route selection
  useEffect(() => {
    if (!formData.routeName || !opsData.length) return
    
    const routeData = opsData.find(item => 
      item['Route Name']?.toString().trim() === formData.routeName.toString().trim()
    )
    
    if (routeData) {
      setFormData(prev => ({
        ...prev,
        accountName: routeData['Vendor Name'] || routeData['Captain Name'] || '',
        vendorName: routeData['Vendor Name'] || '',
        captainName: routeData['Captain Name'] || '',
        captainContact: routeData['Captain Personal Mobile'] || '',
        company: routeData['Company'] || ''
      }))
    }
  }, [formData.routeName, opsData])

  // Get available users for selected department
  const availableUsers = useMemo(() => {
    if (!formData.assignedDept) return []
    return users.filter(u => u.department === formData.assignedDept && u.status === 'active')
  }, [formData.assignedDept, users])

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const companies = [...new Set(opsData.map(item => item['Company']).filter(Boolean))]
    const deptNames = departments.map(d => d.name)
    const userNames = [...new Set(complaints.map(c => c.assignedTo).filter(Boolean))]
    return { companies, deptNames, userNames }
  }, [opsData, departments, complaints])

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = 
        c.ticketNo?.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.routeName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.captainName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.issueDetails?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesDept = filters.department === 'all' || c.assignedDept === filters.department
      const matchesUser = filters.assignedTo === 'all' || c.assignedTo === filters.assignedTo
      const matchesStatus = filters.status === 'all' || c.ticketStatus === filters.status
      const matchesCompany = filters.company === 'all' || c.company === filters.company
      
      let matchesDate = true
      if (filters.dateFrom) {
        matchesDate = new Date(c.date) >= new Date(filters.dateFrom)
      }
      if (filters.dateTo && matchesDate) {
        matchesDate = new Date(c.date) <= new Date(filters.dateTo)
      }
      
      return matchesSearch && matchesDept && matchesUser && matchesStatus && matchesCompany && matchesDate
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [complaints, filters])

  // MY TICKETS STATS
  const myStats = useMemo(() => {
    const myTickets = complaints.filter(c => c.submittedById === currentUser?.id)
    return {
      myTotal: myTickets.length,
      myOpen: myTickets.filter(c => c.ticketStatus === 'Open').length,
      myInProgress: myTickets.filter(c => c.ticketStatus === 'In Progress').length,
      myClosed: myTickets.filter(c => c.ticketStatus === 'Closed').length
    }
  }, [complaints, currentUser])

  // Save complaints
  const saveComplaints = useCallback((updated) => {
    setComplaints(updated)
    localStorage.setItem('complaints', JSON.stringify(updated))
  }, [])

  // Handle form submit
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
        routeName: formData.routeName,
        company: formData.company,
        accountName: formData.accountName,
        vendorName: formData.vendorName,
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
          id: `act-${Date.now()}`,
          type: 'created',
          text: `Ticket created by ${currentUser?.name} and assigned to ${formData.assignedToName}`,
          by: currentUser?.name,
          timestamp: new Date().toISOString()
        }]
      }
      
      const updated = [newComplaint, ...complaints]
      saveComplaints(updated)
      resetForm()
      setShowAddModal(false)
      
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      routeName: '',
      accountName: '',
      vendorName: '',
      captainName: '',
      captainContact: '',
      company: '',
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
  }

  // Add comment - INSTANT UPDATE
  const addComment = useCallback(() => {
    if (!newComment.trim() || !selectedComplaint) return
    
    const comment = {
      id: `cmt-${Date.now()}`,
      text: newComment.trim(),
      by: currentUser?.name,
      userId: currentUser?.id,
      timestamp: new Date().toISOString(),
      type: 'comment'
    }
    
    const updatedComplaint = {
      ...selectedComplaint,
      comments: [...(selectedComplaint.comments || []), comment],
      activityLog: [
        ...(selectedComplaint.activityLog || []),
        {
          id: `act-${Date.now()}`,
          type: 'comment',
          text: `Comment added by ${currentUser?.name}`,
          by: currentUser?.name,
          timestamp: new Date().toISOString()
        }
      ]
    }
    
    setSelectedComplaint(updatedComplaint)
    
    const updatedList = complaints.map(c => 
      c.id === selectedComplaint.id ? updatedComplaint : c
    )
    saveComplaints(updatedList)
    
    setNewComment('')
  }, [newComment, selectedComplaint, currentUser, complaints, saveComplaints])

  // Update status
  const updateStatus = useCallback((newStatus) => {
    if (!selectedComplaint) return
    
    const canChange = 
      selectedComplaint.assignedTo === currentUser?.name ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin'
    
    if (!canChange) {
      alert('Only assigned user or Admin can change status')
      return
    }
    
    const updatedComplaint = {
      ...selectedComplaint,
      ticketStatus: newStatus,
      complaintStatus: newStatus === 'Closed' ? 'Resolved' : newStatus === 'In Progress' ? 'In Progress' : 'Pending',
      resolvedPercent: newStatus === 'Closed' ? 100 : newStatus === 'In Progress' ? 50 : 0,
      resolvedDate: newStatus === 'Closed' ? new Date().toISOString() : null,
      activityLog: [
        ...(selectedComplaint.activityLog || []),
        {
          id: `act-${Date.now()}`,
          type: 'status_change',
          text: `Status changed to ${newStatus} by ${currentUser?.name}`,
          by: currentUser?.name,
          fromStatus: selectedComplaint.ticketStatus,
          toStatus: newStatus,
          timestamp: new Date().toISOString()
        }
      ]
    }
    
    setSelectedComplaint(updatedComplaint)
    
    const updatedList = complaints.map(c => 
      c.id === selectedComplaint.id ? updatedComplaint : c
    )
    saveComplaints(updatedList)
  }, [selectedComplaint, currentUser, complaints, saveComplaints])

  const openDetail = (complaint) => {
    setSelectedComplaint(complaint)
    setActiveTab('details')
    setShowDetailModal(true)
  }

  const uniqueRoutes = useMemo(() => {
    const routes = [...new Set(opsData.map(item => item['Route Name']).filter(Boolean))]
    return routes.sort()
  }, [opsData])

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Complaint Board</h1>
          <p>Manage and track all complaints & tickets</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Complaint
        </button>
      </div>

      {/* MY TICKETS STATS - NEW */}
      <div className={styles.statsSection}>
        <h3>My Tickets Overview</h3>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.myTickets}`}>
            <User size={24} color="#00d4ff" />
            <div>
              <span className={styles.statValue}>{myStats.myTotal}</span>
              <span className={styles.statLabel}>Total Submitted</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <AlertCircle size={24} color="#ff6b6b" />
            <div>
              <span className={styles.statValue}>{myStats.myOpen}</span>
              <span className={styles.statLabel}>My Open</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <Clock size={24} color="#ffa726" />
            <div>
              <span className={styles.statValue}>{myStats.myInProgress}</span>
              <span className={styles.statLabel}>My In Progress</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <CheckCircle2 size={24} color="#66bb6a" />
            <div>
              <span className={styles.statValue}>{myStats.myClosed}</span>
              <span className={styles.statLabel}>My Closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar - REORGANIZED */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
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
        </div>
        
        <button className={styles.clearBtn} onClick={() => setFilters({
          search: '', department: 'all', assignedTo: 'all', status: 'all', company: 'all', dateFrom: '', dateTo: ''
        })}>
          Clear
        </button>
      </div>

      {/* Secondary Filters - Date & Company */}
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

      {/* Complaints Table */}
      <div className={styles.tableContainer}>
        <table className={styles.complaintsTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Ticket No</th>
              <th>Route</th>
              <th>Category</th>
              <th>Sub Issue</th>
              <th>Department</th>
              <th>Assigned To</th>
              <th>Source</th>
              <th>Status</th>
              <th>Resolve Ratio</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.map(complaint => {
              const ratio = calculateResolveRatio(complaint)
              return (
                <tr key={complaint.id}>
                  <td className={styles.dateCell}>{formatDateDDMMYYYY(complaint.date)}</td>
                  <td className={styles.ticketCell}>
                    <span className={styles.ticketNo}>{complaint.ticketNo}</span>
                  </td>
                  <td>{complaint.routeName || '-'}</td>
                  <td>
                    <span className={styles.categoryBadge}>{complaint.issueCategoryName || complaint.issueCategory}</span>
                  </td>
                  <td>{complaint.issueSubCategoryName || '-'}</td>
                  <td>{complaint.assignedDept}</td>
                  <td>
                    <div className={styles.assignedCell}>
                      <User size={14} />
                      {complaint.assignedTo || '-'}
                    </div>
                  </td>
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
                      <button className={styles.viewBtn} onClick={() => openDetail(complaint)} title="View Details">
                        <Eye size={16} />
                      </button>
                      <button className={styles.commentBtn} onClick={() => openDetail(complaint)} title="Add Comment">
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

      {/* ADD MODAL - Click outside closes */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={(e) => { if(e.target === e.currentTarget) setShowAddModal(false) }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><Plus size={20} /> Add New Complaint</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Route Name *</label>
                  <select value={formData.routeName} onChange={(e) => setFormData({...formData, routeName: e.target.value})} required>
                    <option value="">Select Route</option>
                    {uniqueRoutes.map(route => <option key={route} value={route}>{route}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Company</label>
                  <input type="text" value={formData.company} readOnly className={styles.readOnly} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Captain Name</label>
                  <input type="text" value={formData.captainName} readOnly className={styles.readOnly} />
                </div>
                <div className={styles.formGroup}>
                  <label>Captain Contact</label>
                  <input type="text" value={formData.captainContact} readOnly className={styles.readOnly} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Vendor Name</label>
                  <input type="text" value={formData.vendorName} readOnly className={styles.readOnly} />
                </div>
                <div className={styles.formGroup}>
                  <label>Account Name</label>
                  <input type="text" value={formData.accountName} readOnly className={styles.readOnly} />
                </div>
              </div>

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

              <div className={styles.formRow}>
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

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Assign Department *</label>
                  <select value={formData.assignedDept} onChange={(e) => {
                    setFormData({...formData, assignedDept: e.target.value, assignedTo: '', assignedToName: ''})
                  }} required>
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
                  {formData.assignedDept && availableUsers.length === 0 && (
                    <small className={styles.noUsers}>No active users in this department</small>
                  )}
                </div>
              </div>

              <div className={styles.formGroupFull}>
                <label>Issue Details *</label>
                <textarea rows="4" value={formData.issueDetails} onChange={(e) => setFormData({...formData, issueDetails: e.target.value})} placeholder="Describe the issue in detail..." required />
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL - NO click outside, only close button */}
      {showDetailModal && selectedComplaint && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.detailModal}`}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{selectedComplaint.ticketNo}</h2>
                <span className={styles.subHeader}>Created {formatDateDDMMYYYY(selectedComplaint.date)} by {selectedComplaint.submittedBy}</span>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.tabs}>
              <button className={activeTab === 'details' ? styles.active : ''} onClick={() => setActiveTab('details')}>Details</button>
              <button className={activeTab === 'comments' ? styles.active : ''} onClick={() => setActiveTab('comments')}>Comments ({selectedComplaint.comments?.length || 0})</button>
              <button className={activeTab === 'history' ? styles.active : ''} onClick={() => setActiveTab('history')}>History</button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'details' && (
                <div className={styles.detailsTab}>
                  <div className={styles.statusControl}>
                    <label>Ticket Status</label>
                    <div className={styles.statusButtons}>
                      {Object.values(TICKET_STATUS).map(status => {
                        const canChange = selectedComplaint.assignedTo === currentUser?.name || currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
                        return (
                          <button
                            key={status.value}
                            className={`${styles.statusBtn} ${selectedComplaint.ticketStatus === status.value ? styles.active : ''}`}
                            style={{
                              background: selectedComplaint.ticketStatus === status.value ? status.bg : '#f5f5f5',
                              color: selectedComplaint.ticketStatus === status.value ? status.color : '#666'
                            }}
                            onClick={() => canChange && updateStatus(status.value)}
                            disabled={!canChange}
                          >
                            {status.label}
                          </button>
                        )
                      })}
                    </div>
                    {selectedComplaint.assignedTo !== currentUser?.name && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin' && (
                      <span className={styles.permissionNote}>Only {selectedComplaint.assignedTo} can change status</span>
                    )}
                  </div>

                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}><label>Route</label><span>{selectedComplaint.routeName}</span></div>
                    <div className={styles.detailItem}><label>Company</label><span>{selectedComplaint.company || '-'}</span></div>
                    <div className={styles.detailItem}><label>Captain</label><span>{selectedComplaint.captainName || '-'}</span></div>
                    <div className={styles.detailItem}><label>Contact</label><span>{selectedComplaint.captainContact || '-'}</span></div>
                    <div className={styles.detailItem}><label>Category</label><span>{selectedComplaint.issueCategoryName}</span></div>
                    <div className={styles.detailItem}><label>Sub Category</label><span>{selectedComplaint.issueSubCategoryName || '-'}</span></div>
                    <div className={styles.detailItem}><label>Department</label><span>{selectedComplaint.assignedDept}</span></div>
                    <div className={styles.detailItem}><label>Assigned To</label><span className={styles.assignedHighlight}>{selectedComplaint.assignedTo}</span></div>
                    <div className={styles.detailItem}>
                      <label>Source</label>
                      <span className={`${styles.sourceBadge} ${styles[selectedComplaint.complaintBy]}`}>
                        {COMPLAINT_BY_OPTIONS.find(o => o.value === selectedComplaint.complaintBy)?.label}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Priority</label>
                      <span className={`${styles.priority} ${styles[selectedComplaint.priority]}`}>{selectedComplaint.priority?.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className={styles.issueBox}>
                    <label>Issue Details</label>
                    <p>{selectedComplaint.issueDetails}</p>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className={styles.commentsTab}>
                  <div className={styles.commentsList}>
                    {(selectedComplaint.comments || []).length === 0 ? (
                      <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
                    ) : (
                      selectedComplaint.comments.map(comment => (
                        <div key={comment.id} className={styles.commentItem}>
                          <div className={styles.commentHeader}>
                            <span className={styles.commentAuthor}>{comment.by}</span>
                            <span className={styles.commentTime}>{formatDateDDMMYYYY(comment.timestamp)} {new Date(comment.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className={styles.commentText}>{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className={styles.commentInput}>
                    <textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows="3" />
                    <button className={styles.sendBtn} onClick={addComment} disabled={!newComment.trim()}>
                      <Send size={18} /> Send
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className={styles.historyTab}>
                  <div className={styles.timeline}>
                    {(selectedComplaint.activityLog || []).map((activity, index) => (
                      <div key={activity.id || index} className={styles.timelineItem}>
                        <div className={styles.timelineDot} />
                        <div className={styles.timelineContent}>
                          <p>{activity.text}</p>
                          <span>{formatDateDDMMYYYY(activity.timestamp)} {new Date(activity.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplaintBoard