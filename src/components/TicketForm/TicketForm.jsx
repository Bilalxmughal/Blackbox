import { useState, useEffect } from 'react'
import { generateTicketNo } from '../../utils/generateTicketNo'
import Dropdown from '../Dropdown/Dropdown'
import styles from './TicketForm.module.css'

function TicketForm({ 
  opsData, 
  categories, 
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    routeName: '',
    accountName: '',
    vendorName: '',
    captainName: '',
    captainContact: '',
    issueCategory: '',
    issueType: '',
    issueDetails: '',
    assignedDept: '',
    assignedTo: '',
    submittedBy: 'Admin',
    ticketStatus: 'Open',
    ticketDetails: '',
    forwardedToDept: '',
    resolveRemarks: '',
    complaintStatus: 'Pending'
  })

  const [filteredSubCategories, setFilteredSubCategories] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])

  // Get unique routes for dropdown
  const routeOptions = [...new Set(opsData.map(item => item.routeName))]
    .filter(Boolean)
    .map(route => ({ value: route, label: route }))

  // Get categories for dropdown
  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
    code: cat.code
  }))

  // When route changes, auto-fill related data
  useEffect(() => {
    if (formData.routeName) {
      const routeData = opsData.find(item => item.routeName === formData.routeName)
      if (routeData) {
        setFormData(prev => ({
          ...prev,
          accountName: routeData.contractorNameInDb || routeData.vendorName || '',
          vendorName: routeData.vendorName || '',
          captainName: routeData.captainName || '',
          captainContact: routeData.captainPersonalMobile || routeData.vendorNumber || ''
        }))
      }
    }
  }, [formData.routeName, opsData])

  // When category changes, update sub-categories
  useEffect(() => {
    if (formData.issueCategory) {
      const category = categories.find(cat => cat.id === formData.issueCategory)
      if (category) {
        setFilteredSubCategories(category.subCategories || [])
        setFormData(prev => ({
          ...prev,
          assignedDept: category.name,
          issueType: ''
        }))
      }
    }
  }, [formData.issueCategory, categories])

  // When sub-category changes, update assigned users
  useEffect(() => {
    if (formData.issueType) {
      const subCat = filteredSubCategories.find(sub => sub.id === formData.issueType)
      if (subCat && subCat.assignedUsers) {
        setFilteredUsers(subCat.assignedUsers)
        setFormData(prev => ({
          ...prev,
          assignedTo: subCat.assignedUsers[0] || ''
        }))
      }
    }
  }, [formData.issueType, filteredSubCategories])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const category = categories.find(cat => cat.id === formData.issueCategory)
    const ticketNo = generateTicketNo(category?.code || 'GEN', formData.date)
    
    onSubmit({
      ...formData,
      ticketNo,
      id: Date.now().toString(),
      resolvedDate: null,
      resolvedInDays: null,
      pendingDays: 0,
      resolvedPercent: 0
    })
  }

  const subCategoryOptions = filteredSubCategories.map(sub => ({
    value: sub.id,
    label: sub.name
  }))

  const userOptions = filteredUsers.map(user => ({
    value: user,
    label: user
  }))

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Date</label>
          <input 
            type="date" 
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            readOnly
          />
        </div>

        <div className={styles.formGroup}>
          <Dropdown
            label="Route Name *"
            options={routeOptions}
            value={formData.routeName}
            onChange={(value) => setFormData({...formData, routeName: value})}
            placeholder="Select Route"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Account Name</label>
          <input 
            type="text" 
            value={formData.accountName}
            readOnly
            className={styles.readOnly}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Vendor Name</label>
          <input 
            type="text" 
            value={formData.vendorName}
            readOnly
            className={styles.readOnly}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Captain Name</label>
          <input 
            type="text" 
            value={formData.captainName}
            readOnly
            className={styles.readOnly}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Captain Contact</label>
          <input 
            type="text" 
            value={formData.captainContact}
            readOnly
            className={styles.readOnly}
          />
        </div>

        <div className={styles.formGroup}>
          <Dropdown
            label="Issue Category *"
            options={categoryOptions}
            value={formData.issueCategory}
            onChange={(value) => setFormData({...formData, issueCategory: value})}
            placeholder="Select Category"
          />
        </div>

        <div className={styles.formGroup}>
          <Dropdown
            label="Issue Type (Sub-Category) *"
            options={subCategoryOptions}
            value={formData.issueType}
            onChange={(value) => setFormData({...formData, issueType: value})}
            placeholder="Select Sub-Category"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Assigned Dept</label>
          <input 
            type="text" 
            value={formData.assignedDept}
            readOnly
            className={styles.readOnly}
          />
        </div>

        <div className={styles.formGroup}>
          <Dropdown
            label="Assigned To"
            options={userOptions}
            value={formData.assignedTo}
            onChange={(value) => setFormData({...formData, assignedTo: value})}
            placeholder="Select User"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Submitted By</label>
          <input 
            type="text" 
            value={formData.submittedBy}
            readOnly
            className={styles.readOnly}
          />
        </div>

        <div className={styles.formGroup}>
          <Dropdown
            label="Ticket Status"
            options={[
              { value: 'Open', label: 'Open' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Closed', label: 'Closed' }
            ]}
            value={formData.ticketStatus}
            onChange={(value) => setFormData({...formData, ticketStatus: value})}
          />
        </div>
      </div>

      <div className={styles.formGroupFull}>
        <label>Issue Details *</label>
        <textarea 
          rows="3"
          value={formData.issueDetails}
          onChange={(e) => setFormData({...formData, issueDetails: e.target.value})}
          placeholder="Describe the issue..."
          required
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Ticket Details</label>
        <textarea 
          rows="2"
          value={formData.ticketDetails}
          onChange={(e) => setFormData({...formData, ticketDetails: e.target.value})}
          placeholder="Additional ticket details..."
        />
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn}>
          Create Ticket
        </button>
      </div>
    </form>
  )
}

export default TicketForm