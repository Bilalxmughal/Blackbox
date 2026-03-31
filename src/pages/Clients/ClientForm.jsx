import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, Save, Building2, User, Mail, 
  MapPin, Briefcase, Tag
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { 
  createClient, 
  updateClient, 
  getClientById 
} from '../../lib/firebase'
import { 
  CLIENT_LOCATIONS, 
  BUSINESS_TYPES, 
  INDUSTRIES,
  generateClientId,
  canAddClient,
  canEditClient
} from '../../data/clientConfig'
import styles from './Clients.module.css'

function ClientForm() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  
  const isEditMode = !!id
  const canSubmit = isEditMode ? canEditClient(currentUser) : canAddClient(currentUser)
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  const [formData, setFormData] = useState({
    legalName: '',
    industry: '',
    location: '',
    billingAddress: '',
    pocName: '',
    pocEmail: '',
    accountManager: '',
    accountManagerEmail: '',
    businessType: '',
    status: 'active'
  })

  // Load existing clients for ID generation and edit mode
  const [existingClients, setExistingClients] = useState([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      // Load existing clients from localStorage
      const saved = localStorage.getItem('clients')
      const clients = saved ? JSON.parse(saved) : []
      setExistingClients(clients)
      
      // If edit mode, load client data
      if (isEditMode && id) {
        // Try to find in localStorage first
        const existing = clients.find(c => c.id === id)
        if (existing) {
          setFormData({
            legalName: existing.legalName || '',
            industry: existing.industry || '',
            location: existing.location || '',
            billingAddress: existing.billingAddress || '',
            pocName: existing.pocName || '',
            pocEmail: existing.pocEmail || '',
            accountManager: existing.accountManager || '',
            accountManagerEmail: existing.accountManagerEmail || '',
            businessType: existing.businessType || '',
            status: existing.status || 'active'
          })
        } else {
          // Try Firebase
          try {
            const result = await getClientById(id)
            if (result.success) {
              const existing = result.data
              setFormData({
                legalName: existing.legalName || '',
                industry: existing.industry || '',
                location: existing.location || '',
                billingAddress: existing.billingAddress || '',
                pocName: existing.pocName || '',
                pocEmail: existing.pocEmail || '',
                accountManager: existing.accountManager || '',
                accountManagerEmail: existing.accountManagerEmail || '',
                businessType: existing.businessType || '',
                status: existing.status || 'active'
              })
            }
          } catch (err) {
            console.error('Error loading client:', err)
            alert('Client not found!')
            navigate('/clients')
          }
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [id, isEditMode, navigate])

  // Validation
  const validate = () => {
    const newErrors = {}
    
    if (!formData.legalName.trim()) newErrors.legalName = 'Legal name is required'
    if (!formData.industry) newErrors.industry = 'Industry is required'
    if (!formData.location) newErrors.location = 'Location is required'
    if (!formData.billingAddress.trim()) newErrors.billingAddress = 'Billing address is required'
    if (!formData.pocName.trim()) newErrors.pocName = 'POC name is required'
    if (!formData.pocEmail.trim()) {
      newErrors.pocEmail = 'POC email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.pocEmail)) {
      newErrors.pocEmail = 'Invalid email format'
    }
    if (!formData.accountManager.trim()) newErrors.accountManager = 'Account manager is required'
    if (!formData.accountManagerEmail.trim()) {
      newErrors.accountManagerEmail = 'Account manager email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.accountManagerEmail)) {
      newErrors.accountManagerEmail = 'Invalid email format'
    }
    if (!formData.businessType) newErrors.businessType = 'Business type is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!canSubmit) {
      alert('You do not have permission to ' + (isEditMode ? 'edit' : 'add') + ' clients!')
      return
    }
    
    if (!validate()) return
    
    setSaving(true)
    
    try {
      const clientData = {
        ...formData,
        updatedAt: new Date().toISOString()
      }
      
      if (isEditMode) {
        // Update existing client
        const saved = localStorage.getItem('clients')
        const clients = saved ? JSON.parse(saved) : []
        const updated = clients.map(c => c.id === id ? { ...c, ...clientData } : c)
        localStorage.setItem('clients', JSON.stringify(updated))
        
        // Sync to Firebase
        if (id && !id.startsWith('cli-')) {
          await updateClient(id, clientData)
        }
        
        alert('Client updated successfully!')
      } else {
        // Create new client with auto-generated ID
        const newClientId = generateClientId(existingClients)
        const newClient = {
          ...clientData,
          clientId: newClientId,
          createdAt: new Date().toISOString(),
          id: `cli-${Date.now()}`
        }
        
        // Save to localStorage first
        const saved = localStorage.getItem('clients')
        const clients = saved ? JSON.parse(saved) : []
        const updated = [newClient, ...clients]
        localStorage.setItem('clients', JSON.stringify(updated))
        
        // Sync to Firebase
        const result = await createClient(newClient)
        if (result.success) {
          // Update with Firebase ID
          const finalUpdated = updated.map(c => 
            c.id === newClient.id ? { ...c, id: result.id, firebaseId: result.id } : c
          )
          localStorage.setItem('clients', JSON.stringify(finalUpdated))
        }
        
        alert(`Client created successfully!\n\nClient ID: ${newClientId}`)
      }
      
      navigate('/clients')
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Failed to save client. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }


  return (
    <div className={styles.formContainer}>
      {/* Header */}
      <div className={styles.formHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/clients')}>
          <ArrowLeft size={18} /> Back to Clients
        </button>
        <div className={styles.formTitle}>
          <h1>{isEditMode ? 'Edit Client' : 'Add New Client'}</h1>
          <p>{isEditMode ? 'Update client information' : 'Create a new client account'}</p>
        </div>
        <div className={styles.headerSpacer} />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Client Information Section */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <Building2 size={20} color="#00d4ff" />
            <h3>Client Information</h3>
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Client Legal Name *</label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => handleChange('legalName', e.target.value)}
                placeholder="Enter company legal name"
                className={errors.legalName ? styles.error : ''}
              />
              {errors.legalName && <span className={styles.errorText}>{errors.legalName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Industry *</label>
              <select
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className={errors.industry ? styles.error : ''}
              >
                <option value="">Select Industry</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
              {errors.industry && <span className={styles.errorText}>{errors.industry}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Client Location *</label>
              <select
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className={errors.location ? styles.error : ''}
              >
                <option value="">Select Location</option>
                {CLIENT_LOCATIONS.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
              {errors.location && <span className={styles.errorText}>{errors.location}</span>}
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Client Billing Address *</label>
              <textarea
                rows="3"
                value={formData.billingAddress}
                onChange={(e) => handleChange('billingAddress', e.target.value)}
                placeholder="Enter complete billing address"
                className={errors.billingAddress ? styles.error : ''}
              />
              {errors.billingAddress && <span className={styles.errorText}>{errors.billingAddress}</span>}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <User size={20} color="#9b59b6" />
            <h3>Contact Information</h3>
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Client POC Name *</label>
              <input
                type="text"
                value={formData.pocName}
                onChange={(e) => handleChange('pocName', e.target.value)}
                placeholder="Point of contact name"
                className={errors.pocName ? styles.error : ''}
              />
              {errors.pocName && <span className={styles.errorText}>{errors.pocName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Client POC Email *</label>
              <input
                type="email"
                value={formData.pocEmail}
                onChange={(e) => handleChange('pocEmail', e.target.value)}
                placeholder="poc@company.com"
                className={errors.pocEmail ? styles.error : ''}
              />
              {errors.pocEmail && <span className={styles.errorText}>{errors.pocEmail}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Account Manager *</label>
              <input
                type="text"
                value={formData.accountManager}
                onChange={(e) => handleChange('accountManager', e.target.value)}
                placeholder="Internal account manager name"
                className={errors.accountManager ? styles.error : ''}
              />
              {errors.accountManager && <span className={styles.errorText}>{errors.accountManager}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Account Manager Email *</label>
              <input
                type="email"
                value={formData.accountManagerEmail}
                onChange={(e) => handleChange('accountManagerEmail', e.target.value)}
                placeholder="manager@buscaro.com"
                className={errors.accountManagerEmail ? styles.error : ''}
              />
              {errors.accountManagerEmail && <span className={styles.errorText}>{errors.accountManagerEmail}</span>}
            </div>
          </div>
        </div>

        {/* Business Information Section */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <Briefcase size={20} color="#6bcf7f" />
            <h3>Business Information</h3>
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Business Type *</label>
              <select
                value={formData.businessType}
                onChange={(e) => handleChange('businessType', e.target.value)}
                className={errors.businessType ? styles.error : ''}
              >
                <option value="">Select Business Type</option>
                {BUSINESS_TYPES.map(bt => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
              {errors.businessType && <span className={styles.errorText}>{errors.businessType}</span>}
            </div>

            {isEditMode && (
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelBtn} 
            onClick={() => navigate('/clients')}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={saving || !canSubmit}
          >
            <Save size={18} />
            {saving ? 'Saving...' : (isEditMode ? 'Update Client' : 'Create Client')}
          </button>
        </div>

        {!canSubmit && (
          <div className={styles.permissionWarning}>
            <AlertCircle size={16} />
            <span>You don't have permission to {isEditMode ? 'edit' : 'add'} clients. Contact Super Admin.</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default ClientForm