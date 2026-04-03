import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, User, Phone, CreditCard, FileText, Upload, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { VENDOR_STATUS, FILER_STATUS, BANK_NAMES, formatCNIC, formatPhone, validatePhone, validateCNIC, generateVendorId, canAddVendor, canEditVendor } from '../../data/vendorConfig'
import styles from './Vendors.module.css'

function VendorForm() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  
  const isEditMode = !!id
  const canSubmit = isEditMode ? canEditVendor(currentUser) : canAddVendor(currentUser)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [existingVendors, setExistingVendors] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cnic: '',
    filerStatus: 'no',      // ✅ Yes/No
    vendorStatus: 'active', // ✅ Active/Non Active
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    cnicFront: '',
    cnicBack: ''
  })

  // Load data
  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem('vendors')
      const vendors = saved ? JSON.parse(saved) : []
      setExistingVendors(vendors)

      if (isEditMode && id) {
        const vendor = vendors.find(v => v.id === id)
        if (vendor) {
          setFormData({
            name: vendor.name || '',
            phone: vendor.phone || '',
            cnic: vendor.cnic || '',
            filerStatus: vendor.filerStatus || 'no',
            vendorStatus: vendor.vendorStatus || 'active',
            bankName: vendor.bankName || '',
            accountTitle: vendor.accountTitle || '',
            accountNumber: vendor.accountNumber || '',
            cnicFront: vendor.cnicFront || '',
            cnicBack: vendor.cnicBack || ''
          })
        } else {
          alert('Vendor not found!')
          navigate('/vendors')
        }
      }
    }
    loadData()
  }, [id, isEditMode, navigate])

  // Check permissions
  useEffect(() => {
    if (isEditMode && !canEditVendor(currentUser)) {
      alert('No permission to edit!')
      navigate('/vendors')
    }
    if (!isEditMode && !canAddVendor(currentUser)) {
      alert('No permission to add!')
      navigate('/vendors')
    }
  }, [isEditMode, currentUser, navigate])

  const handleChange = (field, value) => {
    if (field === 'cnic') {
      value = formatCNIC(value)
    } else if (field === 'phone') {
      value = formatPhone(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [type]: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Vendor name is required'
    
    if (!formData.phone) {
      newErrors.phone = 'Contact number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Enter valid 10 digit number'
    }
    
    if (!formData.cnic) {
      newErrors.cnic = 'CNIC is required'
    } else if (!validateCNIC(formData.cnic)) {
      newErrors.cnic = 'Enter valid 13 digit CNIC'
    }
    
    if (!formData.bankName) newErrors.bankName = 'Bank name is required'
    if (!formData.accountTitle.trim()) newErrors.accountTitle = 'Account title is required'
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required'
    
    if (!isEditMode && !formData.cnicFront) newErrors.cnicFront = 'CNIC front image required'
    if (!isEditMode && !formData.cnicBack) newErrors.cnicBack = 'CNIC back image required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!canSubmit) {
      alert(`No permission to ${isEditMode ? 'edit' : 'add'} vendors!`)
      return
    }
    
    if (!validate()) return
    
    setSaving(true)

    try {
      const vendorData = {
        ...formData,
        updatedAt: new Date().toISOString()
      }
      
      let updatedVendors
      if (isEditMode) {
        updatedVendors = existingVendors.map(v => 
          v.id === id ? { ...v, ...vendorData } : v
        )
      } else {
        const vendorId = generateVendorId(existingVendors)
        const newVendor = {
          ...vendorData,
          vendorId,
          id: `ven-${Date.now()}`,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.uid || 'unknown'
        }
        updatedVendors = [newVendor, ...existingVendors]
      }
      
      localStorage.setItem('vendors', JSON.stringify(updatedVendors))
      
      alert(isEditMode ? 'Vendor updated!' : `Vendor created!\n\nVendor ID: ${updatedVendors[0].vendorId}`)
      navigate('/vendors')
    } catch (error) {
      console.error('Error saving vendor:', error)
      alert('Failed to save vendor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.formContainer}>
      {/* Header */}
      <div className={styles.formHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/vendors')}>
          <ArrowLeft size={18} /> Back to Vendors
        </button>
        <div className={styles.formTitle}>
          <h1>{isEditMode ? 'Edit Vendor' : 'Add New Vendor'}</h1>
          <p>{isEditMode ? 'Update vendor information' : 'Create a new vendor account'}</p>
        </div>
        <div className={styles.headerSpacer} />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Info */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <User size={20} color="#00d4ff" />
            <h3>Basic Information</h3>
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Vendor Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter vendor name"
                className={errors.name ? styles.error : ''}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            {/* ✅ FILER STATUS - Yes/No */}
            <div className={styles.formGroup}>
              <label>Filer Status</label>
              <select 
                value={formData.filerStatus} 
                onChange={(e) => handleChange('filerStatus', e.target.value)}
              >
                {FILER_STATUS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>


            <div className={styles.formGroup}>
              <label>Contact Number * <small>(+92 pre-filled)</small></label>
              <div className={styles.phoneInput}>
                <span className={styles.countryCode}>+92</span>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="300 0000000"
                  maxLength="12"
                  className={errors.phone ? styles.error : ''}
                />
              </div>
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>CNIC * <small>(00000-0000000-0)</small></label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => handleChange('cnic', e.target.value)}
                placeholder="00000-0000000-0"
                maxLength="15"
                className={errors.cnic ? styles.error : ''}
              />
              {errors.cnic && <span className={styles.errorText}>{errors.cnic}</span>}
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <CreditCard size={20} color="#9b59b6" />
            <h3>Bank Details</h3>
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Bank Name *</label>
              <select 
                value={formData.bankName} 
                onChange={(e) => handleChange('bankName', e.target.value)}
                className={errors.bankName ? styles.error : ''}
              >
                <option value="">Select Bank</option>
                {BANK_NAMES.map(bank => (
                  <option key={bank.value} value={bank.value}>{bank.label}</option>
                ))}
              </select>
              {errors.bankName && <span className={styles.errorText}>{errors.bankName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Account Title *</label>
              <input
                type="text"
                value={formData.accountTitle}
                onChange={(e) => handleChange('accountTitle', e.target.value)}
                placeholder="Account holder name"
                className={errors.accountTitle ? styles.error : ''}
              />
              {errors.accountTitle && <span className={styles.errorText}>{errors.accountTitle}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Bank Account Number *</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                placeholder="Enter account number"
                className={errors.accountNumber ? styles.error : ''}
              />
              {errors.accountNumber && <span className={styles.errorText}>{errors.accountNumber}</span>}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <FileText size={20} color="#6bcf7f" />
            <h3>Documents Upload</h3>
          </div>
          
          <div className={styles.uploadGrid}>
            {/* CNIC Front */}
            <div className={styles.uploadBox}>
              <label>CNIC Front *</label>
              <div 
                className={`${styles.dropZone} ${errors.cnicFront ? styles.error : ''}`}
                onClick={() => document.getElementById('cnicFront').click()}
              >
                {formData.cnicFront ? (
                  <img src={formData.cnicFront} alt="CNIC Front" className={styles.preview} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <Upload size={32} color="#999" />
                    <span>Click to upload CNIC Front</span>
                    <small>JPG, PNG (Max 5MB)</small>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="cnicFront"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'cnicFront')}
                hidden
              />
              {errors.cnicFront && <span className={styles.errorText}>{errors.cnicFront}</span>}
            </div>

            {/* CNIC Back */}
            <div className={styles.uploadBox}>
              <label>CNIC Back *</label>
              <div 
                className={`${styles.dropZone} ${errors.cnicBack ? styles.error : ''}`}
                onClick={() => document.getElementById('cnicBack').click()}
              >
                {formData.cnicBack ? (
                  <img src={formData.cnicBack} alt="CNIC Back" className={styles.preview} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <Upload size={32} color="#999" />
                    <span>Click to upload CNIC Back</span>
                    <small>JPG, PNG (Max 5MB)</small>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="cnicBack"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'cnicBack')}
                hidden
              />
              {errors.cnicBack && <span className={styles.errorText}>{errors.cnicBack}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelBtn} 
            onClick={() => navigate('/vendors')}
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
            {saving ? 'Saving...' : (isEditMode ? 'Update Vendor' : 'Create Vendor')}
          </button>
        </div>

        {!canSubmit && (
          <div className={styles.permissionWarning}>
            <AlertCircle size={16} />
            <span>No permission to {isEditMode ? 'edit' : 'add'} vendors. Contact Super Admin.</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default VendorForm