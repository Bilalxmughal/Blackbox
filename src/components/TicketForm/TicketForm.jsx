import { useState, useEffect } from 'react'
import { generateTicketNo } from '../../utils/generateTicketNo'
import Dropdown from '../Dropdown/Dropdown'
import styles from './TicketForm.module.css'

function TicketForm({ opsData, categories, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    complaintType: '',   // 'new' | 'record'
    // Record flow
    routeName: '',
    // New flow
    company: '',
    vendorName: '',
    captainName: '',
    captainContact: '',
    busNumber: '',
    vendorContact: '',
    // Common
    issueCategory: '',
    issueType: '',
    issueDetails: '',
    assignedDept: '',
    assignedTo: '',
    submittedBy: 'Admin',
    ticketStatus: 'Open',
    ticketDetails: '',
    complaintStatus: 'Pending'
  })

  const [filteredSubCategories, setFilteredSubCategories] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])

  // ─── Derived options from opsData ───────────────────────────────────────

  // Unique companies
  const companyOptions = [...new Set(opsData.map(r => r['Company']).filter(Boolean))]
    .sort()
    .map(c => ({ value: c, label: c }))

  // Vendors for selected company
  const vendorOptions = formData.company
    ? [...new Set(
        opsData
          .filter(r => r['Company'] === formData.company)
          .map(r => r['Vendor Name'])
          .filter(Boolean)
      )].sort().map(v => ({ value: v, label: v }))
    : []

  // Captains for selected vendor
  const captainOptions = formData.vendorName
    ? [...new Set(
        opsData
          .filter(r => r['Vendor Name'] === formData.vendorName)
          .map(r => r['Captain Name'])
          .filter(Boolean)
      )].sort().map(c => ({ value: c, label: c }))
    : []

  // Routes for Record flow
  const routeOptions = [...new Set(opsData.map(r => r['Route Name']).filter(Boolean))]
    .sort()
    .map(r => ({ value: r, label: r }))

  // ─── Auto-fill: Captain selected → contact + bus number ──────────────────
  useEffect(() => {
    if (!formData.captainName || !formData.vendorName) return
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
  }, [formData.captainName, formData.vendorName, opsData])

  // ─── Auto-fill: Route selected (Record flow) ─────────────────────────────
  useEffect(() => {
    if (!formData.routeName || formData.complaintType !== 'record') return
    const row = opsData.find(r => r['Route Name'] === formData.routeName)
    if (row) {
      setFormData(prev => ({
        ...prev,
        company: row['Company'] || '',
        vendorName: row['Vendor Name'] || '',
        captainName: row['Captain Name'] || '',
        captainContact: row['Captain Personal Mobile'] || '',
        busNumber: row['Bus Number'] || '',
        vendorContact: row['Vendor Number'] || ''
      }))
    }
  }, [formData.routeName, opsData, formData.complaintType])

  // ─── Category → sub-categories ───────────────────────────────────────────
  useEffect(() => {
    if (!formData.issueCategory) return
    const category = categories.find(cat => cat.id === formData.issueCategory)
    if (category) {
      setFilteredSubCategories(category.subCategories || [])
      setFormData(prev => ({ ...prev, assignedDept: category.name, issueType: '' }))
    }
  }, [formData.issueCategory, categories])

  // ─── Sub-category → users ────────────────────────────────────────────────
  useEffect(() => {
    if (!formData.issueType) return
    const subCat = filteredSubCategories.find(s => s.id === formData.issueType)
    if (subCat?.assignedUsers) {
      setFilteredUsers(subCat.assignedUsers)
      setFormData(prev => ({ ...prev, assignedTo: subCat.assignedUsers[0] || '' }))
    }
  }, [formData.issueType, filteredSubCategories])

  // ─── Reset on complaint type change ──────────────────────────────────────
  const handleComplaintTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      complaintType: type,
      routeName: '',
      company: '',
      vendorName: '',
      captainName: '',
      captainContact: '',
      busNumber: '',
      vendorContact: ''
    }))
  }

  // ─── Reset vendor/captain when company changes ────────────────────────────
  const handleCompanyChange = (company) => {
    setFormData(prev => ({
      ...prev,
      company,
      vendorName: '',
      captainName: '',
      captainContact: '',
      busNumber: '',
      vendorContact: ''
    }))
  }

  // ─── Reset captain when vendor changes ───────────────────────────────────
  const handleVendorChange = (vendorName) => {
    setFormData(prev => ({
      ...prev,
      vendorName,
      captainName: '',
      captainContact: '',
      busNumber: '',
      vendorContact: ''
    }))
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault()
    const category = categories.find(c => c.id === formData.issueCategory)
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

  const subCategoryOptions = filteredSubCategories.map(s => ({ value: s.id, label: s.name }))
  const userOptions = filteredUsers.map(u => ({ value: u, label: u }))
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name, code: c.code }))

  const isNew = formData.complaintType === 'new'
  const isRecord = formData.complaintType === 'record'
  const typeSelected = isNew || isRecord

  return (
    <form onSubmit={handleSubmit} className={styles.form}>

      {/* ── Row 1: Date + Complaint Type ── */}
      <div className={styles.row2}>
        <div className={styles.field}>
          <label>Date</label>
          <input type="date" value={formData.date} readOnly className={styles.readOnly} />
        </div>

        <div className={styles.field}>
          <label>Complaint Type *</label>
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.typeBtn} ${isNew ? styles.typeBtnActive : ''}`}
              onClick={() => handleComplaintTypeChange('new')}
            >
              New
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${isRecord ? styles.typeRecordActive : ''}`}
              onClick={() => handleComplaintTypeChange('record')}
            >
              Record
            </button>
          </div>
        </div>
      </div>

      {/* ── Show rest only after type selected ── */}
      {typeSelected && (
        <>
          {/* ── NEW flow: Company → Vendor → Captain ── */}
          {isNew && (
            <div className={styles.cascadeSection}>
              <div className={styles.cascadeLabel}>Route Information</div>
              <div className={styles.row3}>
                {/* Company */}
                <div className={styles.field}>
                  <Dropdown
                    label="Company *"
                    options={companyOptions}
                    value={formData.company}
                    onChange={handleCompanyChange}
                    placeholder="Select Company"
                  />
                </div>

                {/* Vendor */}
                <div className={styles.field}>
                  <Dropdown
                    label="Vendor Name *"
                    options={vendorOptions}
                    value={formData.vendorName}
                    onChange={handleVendorChange}
                    placeholder={formData.company ? 'Select Vendor' : 'Select Company first'}
                    disabled={!formData.company}
                  />
                </div>

                {/* Captain */}
                <div className={styles.field}>
                  <Dropdown
                    label="Captain / Driver *"
                    options={captainOptions}
                    value={formData.captainName}
                    onChange={(v) => setFormData(prev => ({ ...prev, captainName: v }))}
                    placeholder={formData.vendorName ? 'Select Captain' : 'Select Vendor first'}
                    disabled={!formData.vendorName}
                  />
                </div>
              </div>

              {/* Auto-filled fields */}
              {formData.captainName && (
                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label>Captain Contact</label>
                    <input type="text" value={formData.captainContact} readOnly className={styles.readOnly} placeholder="Auto-filled" />
                  </div>
                  <div className={styles.field}>
                    <label>Vendor Contact</label>
                    <input type="text" value={formData.vendorContact} readOnly className={styles.readOnly} placeholder="Auto-filled" />
                  </div>
                  <div className={styles.field}>
                    <label>Bus Number</label>
                    <input type="text" value={formData.busNumber} readOnly className={styles.readOnly} placeholder="Auto-filled" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RECORD flow: Route select ── */}
          {isRecord && (
            <div className={styles.cascadeSection}>
              <div className={styles.cascadeLabel}>Route Information</div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <Dropdown
                    label="Route Name *"
                    options={routeOptions}
                    value={formData.routeName}
                    onChange={(v) => setFormData(prev => ({ ...prev, routeName: v }))}
                    placeholder="Select Route"
                  />
                </div>
                <div className={styles.field}>
                  <label>Company</label>
                  <input type="text" value={formData.company} readOnly className={styles.readOnly} placeholder="Auto-filled" />
                </div>
              </div>

              {formData.routeName && (
                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label>Vendor Name</label>
                    <input type="text" value={formData.vendorName} readOnly className={styles.readOnly} />
                  </div>
                  <div className={styles.field}>
                    <label>Captain Name</label>
                    <input type="text" value={formData.captainName} readOnly className={styles.readOnly} />
                  </div>
                  <div className={styles.field}>
                    <label>Captain Contact</label>
                    <input type="text" value={formData.captainContact} readOnly className={styles.readOnly} />
                  </div>
                  <div className={styles.field}>
                    <label>Vendor Contact</label>
                    <input type="text" value={formData.vendorContact} readOnly className={styles.readOnly} />
                  </div>
                  <div className={styles.field}>
                    <label>Bus Number</label>
                    <input type="text" value={formData.busNumber} readOnly className={styles.readOnly} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Issue Section ── */}
          <div className={styles.cascadeSection}>
            <div className={styles.cascadeLabel}>Issue Information</div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <Dropdown
                  label="Issue Category *"
                  options={categoryOptions}
                  value={formData.issueCategory}
                  onChange={(v) => setFormData(prev => ({ ...prev, issueCategory: v }))}
                  placeholder="Select Category"
                />
              </div>
              <div className={styles.field}>
                <Dropdown
                  label="Issue Sub-Category *"
                  options={subCategoryOptions}
                  value={formData.issueType}
                  onChange={(v) => setFormData(prev => ({ ...prev, issueType: v }))}
                  placeholder={formData.issueCategory ? 'Select Sub-Category' : 'Select Category first'}
                  disabled={!formData.issueCategory}
                />
              </div>
            </div>

            <div className={styles.row3}>
              <div className={styles.field}>
                <label>Assigned Dept</label>
                <input type="text" value={formData.assignedDept} readOnly className={styles.readOnly} placeholder="Auto-filled" />
              </div>
              <div className={styles.field}>
                <Dropdown
                  label="Assigned To"
                  options={userOptions}
                  value={formData.assignedTo}
                  onChange={(v) => setFormData(prev => ({ ...prev, assignedTo: v }))}
                  placeholder="Select User"
                  disabled={!formData.issueType}
                />
              </div>
              <div className={styles.field}>
                <Dropdown
                  label="Ticket Status"
                  options={[
                    { value: 'Open', label: 'Open' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Closed', label: 'Closed' }
                  ]}
                  value={formData.ticketStatus}
                  onChange={(v) => setFormData(prev => ({ ...prev, ticketStatus: v }))}
                />
              </div>
            </div>
          </div>

          {/* ── Details ── */}
          <div className={styles.field}>
            <label>Issue Details *</label>
            <textarea
              rows="3"
              value={formData.issueDetails}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDetails: e.target.value }))}
              placeholder="Describe the issue..."
              required
            />
          </div>

          <div className={styles.field}>
            <label>Ticket Details</label>
            <textarea
              rows="2"
              value={formData.ticketDetails}
              onChange={(e) => setFormData(prev => ({ ...prev, ticketDetails: e.target.value }))}
              placeholder="Additional details..."
            />
          </div>

          {/* ── Actions ── */}
          <div className={styles.formActions}>
            <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Create Ticket</button>
          </div>
        </>
      )}

      {/* Placeholder when no type selected */}
      {!typeSelected && (
        <div className={styles.typePlaceholder}>
          <span>👆 Select complaint type to continue</span>
        </div>
      )}
    </form>
  )
}

export default TicketForm