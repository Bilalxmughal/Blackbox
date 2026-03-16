import { useState, useEffect, useMemo } from 'react'
import { Plus, Eye, MessageSquare, ArrowRightLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/DataTable/DataTable'
import Modal from '../../components/Modal/Modal'
import TicketDetail from '../../components/TicketDetail/TicketDetail'
import { initialCategories } from '../../data/initialCategories'
import { defaultDepartments } from '../../data/users'
import { generateTicketNo } from '../../utils/generateTicketNo'
import styles from './ComplaintBoard.module.css'

function ComplaintBoard() {
  const { currentUser } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [opsData, setOpsData] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isReassignMode, setIsReassignMode] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    routeName: '',
    accountName: '',
    vendorName: '',
    captainName: '',
    captainContact: '',
    assignedDept: '',
    assignedTo: '',
    issueCategory: '',
    issueType: '',
    issueDetails: '',
    ticketDetails: ''
  })

  useEffect(() => {
    const saved = localStorage.getItem('complaints')
    const savedCats = localStorage.getItem('categories')
    const savedDepts = localStorage.getItem('departments')
    const savedOps = localStorage.getItem('buscaroOpsData')
    
    if (saved) setComplaints(JSON.parse(saved))
    if (savedCats) setCategories(JSON.parse(savedCats))
    else setCategories(initialCategories)
    
    if (savedDepts) setDepartments(JSON.parse(savedDepts))
    else setDepartments(defaultDepartments)
    
    if (savedOps) setOpsData(JSON.parse(savedOps))
  }, [])

  // Auto-fill from route selection
  useEffect(() => {
    if (formData.routeName) {
      const routeData = opsData.find(item => item.routeName === formData.routeName)
      if (routeData) {
        setFormData(prev => ({
          ...prev,
          accountName: routeData.contractorNameInDb || routeData.vendorName || '',
          vendorName: routeData.vendorName || '',
          captainName: routeData.captainName || '',
          captainContact: routeData.captainPersonalMobile || ''
        }))
      }
    }
  }, [formData.routeName, opsData])

  // Update users when department changes
  const availableUsers = useMemo(() => {
    const dept = departments.find(d => d.name === formData.assignedDept)
    if (!dept) return []
    
    const users = JSON.parse(localStorage.getItem('users')) || []
    return users.filter(u => dept.users.includes(u.id))
  }, [formData.assignedDept, departments])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const category = categories.find(c => c.id === formData.issueCategory)
    const ticketNo = generateTicketNo(category?.code || 'GEN', new Date().toISOString())
    
    const newComplaint = {
      id: `comp-${Date.now()}`,
      ticketNo,
      date: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      submittedBy: currentUser?.name || 'System',
      submittedById: currentUser?.id,
      ticketStatus: 'Open',
      complaintStatus: 'Pending',
      resolvedPercent: 0,
      pendingDays: 0,
      comments: [],
      ...formData
    }
    
    const updated = [newComplaint, ...complaints]
    setComplaints(updated)
    localStorage.setItem('complaints', JSON.stringify(updated))
    
    setIsModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      routeName: '',
      accountName: '',
      vendorName: '',
      captainName: '',
      captainContact: '',
      assignedDept: '',
      assignedTo: '',
      issueCategory: '',
      issueType: '',
      issueDetails: '',
      ticketDetails: ''
    })
  }

  const handleReassign = (ticketId, newDept, newUser) => {
    const updated = complaints.map(c => {
      if (c.id === ticketId) {
        return {
          ...c,
          assignedDept: newDept,
          assignedTo: newUser,
          forwardedToDept: c.assignedDept,
          ticketStatus: 'In Progress',
          comments: [
            ...(c.comments || []),
            {
              id: Date.now(),
              text: `Reassigned from ${c.assignedDept} to ${newDept}`,
              by: currentUser?.name,
              timestamp: new Date().toISOString(),
              type: 'system'
            }
          ]
        }
      }
      return c
    })
    
    setComplaints(updated)
    localStorage.setItem('complaints', JSON.stringify(updated))
    setIsReassignMode(false)
    setSelectedTicket(null)
  }

  const addComment = (ticketId, commentText) => {
    const updated = complaints.map(c => {
      if (c.id === ticketId) {
        return {
          ...c,
          comments: [
            ...(c.comments || []),
            {
              id: Date.now(),
              text: commentText,
              by: currentUser?.name,
              timestamp: new Date().toISOString(),
              type: 'comment'
            }
          ]
        }
      }
      return c
    })
    
    setComplaints(updated)
    localStorage.setItem('complaints', JSON.stringify(updated))
  }

  const updateTicketStatus = (ticketId, newStatus) => {
    const updated = complaints.map(c => {
      if (c.id === ticketId) {
        const updates = { ticketStatus: newStatus }
        
        if (newStatus === 'Closed') {
          updates.complaintStatus = 'Resolved'
          updates.resolvedDate = new Date().toISOString()
          updates.resolvedPercent = 100
        } else if (newStatus === 'In Progress') {
          updates.complaintStatus = 'In Progress'
          updates.resolvedPercent = 50
        }
        
        return { ...c, ...updates }
      }
      return c
    })
    
    setComplaints(updated)
    localStorage.setItem('complaints', JSON.stringify(updated))
  }

  const routeOptions = [...new Set(opsData.map(item => item.routeName).filter(Boolean))]
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const deptOptions = departments.map(d => ({ value: d.name, label: d.name }))

  const columns = [
    { header: 'Ticket No', accessor: 'ticketNo' },
    { header: 'Date', accessor: 'date', render: (val) => new Date(val).toLocaleDateString() },
    { header: 'Route', accessor: 'routeName' },
    { header: 'Captain', accessor: 'captainName' },
    { header: 'Department', accessor: 'assignedDept' },
    { header: 'Assigned To', accessor: 'assignedTo' },
    { 
      header: 'Status', 
      accessor: 'ticketStatus',
      render: (val, row) => (
        <select 
          value={val}
          onChange={(e) => updateTicketStatus(row.id, e.target.value)}
          className={`${styles.statusBadge} ${styles[val.replace(' ', '')]}`}
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className={styles.actions}>
          <button 
            onClick={() => setSelectedTicket(row)}
            className={styles.actionBtn}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => {
              setSelectedTicket(row)
              setIsReassignMode(true)
            }}
            className={styles.actionBtn}
            title="Reassign"
          >
            <ArrowRightLeft size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Complaint Board</h1>
          <p>Manage and track all complaints</p>
        </div>
        <button 
          className={styles.addBtn}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
          Add Complaint
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span>{complaints.length}</span>
          <label>Total</label>
        </div>
        <div className={styles.statCard}>
          <span>{complaints.filter(c => c.ticketStatus === 'Open').length}</span>
          <label>Open</label>
        </div>
        <div className={styles.statCard}>
          <span>{complaints.filter(c => c.ticketStatus === 'In Progress').length}</span>
          <label>In Progress</label>
        </div>
        <div className={styles.statCard}>
          <span>{complaints.filter(c => c.ticketStatus === 'Closed').length}</span>
          <label>Closed</label>
        </div>
      </div>

      <DataTable columns={columns} data={complaints} rowsPerPage={10} />

      {/* Add Complaint Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Complaint"
        size="medium"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Route Name *</label>
              <select 
                value={formData.routeName}
                onChange={(e) => setFormData({...formData, routeName: e.target.value})}
                required
              >
                <option value="">Select Route</option>
                {routeOptions.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Account Name</label>
              <input type="text" value={formData.accountName} readOnly className={styles.readOnly} />
            </div>

            <div className={styles.formGroup}>
              <label>Vendor Name</label>
              <input type="text" value={formData.vendorName} readOnly className={styles.readOnly} />
            </div>

            <div className={styles.formGroup}>
              <label>Captain Name</label>
              <input type="text" value={formData.captainName} readOnly className={styles.readOnly} />
            </div>

            <div className={styles.formGroup}>
              <label>Captain Contact</label>
              <input type="text" value={formData.captainContact} readOnly className={styles.readOnly} />
            </div>

            <div className={styles.formGroup}>
              <label>Issue Category *</label>
              <select
                value={formData.issueCategory}
                onChange={(e) => setFormData({...formData, issueCategory: e.target.value, issueType: ''})}
                required
              >
                <option value="">Select Category</option>
                {categoryOptions.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Issue Type *</label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({...formData, issueType: e.target.value})}
                required
                disabled={!formData.issueCategory}
              >
                <option value="">Select Type</option>
                {categories
                  .find(c => c.id === formData.issueCategory)
                  ?.subCategories?.map(sub => (
                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                  ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Assigned Department *</label>
              <select
                value={formData.assignedDept}
                onChange={(e) => setFormData({...formData, assignedDept: e.target.value, assignedTo: ''})}
                required
              >
                <option value="">Select Department</option>
                {deptOptions.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Assigned To *</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                required
                disabled={!formData.assignedDept}
              >
                <option value="">Select User</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroupFull}>
            <label>Issue Details *</label>
            <textarea
              rows="3"
              value={formData.issueDetails}
              onChange={(e) => setFormData({...formData, issueDetails: e.target.value})}
              required
              placeholder="Describe the issue in detail..."
            />
          </div>

          <div className={styles.formGroupFull}>
            <label>Additional Details</label>
            <textarea
              rows="2"
              value={formData.ticketDetails}
              onChange={(e) => setFormData({...formData, ticketDetails: e.target.value})}
              placeholder="Any additional information..."
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Create Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => {
            setSelectedTicket(null)
            setIsReassignMode(false)
          }}
          onAddComment={addComment}
          onReassign={handleReassign}
          isReassignMode={isReassignMode}
          departments={departments}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}

export default ComplaintBoard