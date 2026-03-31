import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, Truck, User, Phone, CreditCard, FileText, 
  Calendar, Edit2, Trash2, AlertCircle, CheckCircle, XCircle,
  Building, Banknote, FileCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { VENDOR_STATUS, FILER_STATUS, BANK_NAMES, canEditVendor, canDeleteVendor } from '../../data/vendorConfig'
import styles from './Vendors.module.css'

function VendorView() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const loadVendor = () => {
      setLoading(true)
      const saved = localStorage.getItem('vendors')
      const vendors = saved ? JSON.parse(saved) : []
      const found = vendors.find(v => v.id === id)
      
      if (found) {
        setVendor(found)
      } else {
        alert('Vendor not found!')
        navigate('/vendors')
      }
      setLoading(false)
    }
    
    loadVendor()
  }, [id, navigate])

  const handleDelete = () => {
    if (!canDeleteVendor(currentUser)) {
      alert('Only Super Admin can delete vendors!')
      return
    }

    const userInput = prompt(`Type "DELETE" to permanently remove ${vendor.name}:`)
    if (userInput !== 'DELETE') {
      alert('Cancelled')
      return
    }

    const saved = localStorage.getItem('vendors')
    const vendors = saved ? JSON.parse(saved) : []
    const updated = vendors.filter(v => v.id !== id)
    localStorage.setItem('vendors', JSON.stringify(updated))
    
    alert('Vendor deleted!')
    navigate('/vendors')
  }

  const getStatusLabel = (value) => {
    return VENDOR_STATUS.find(s => s.value === value)?.label || value
  }

  const getFilerLabel = (value) => {
    return FILER_STATUS.find(s => s.value === value)?.label || value
  }

  const getBankLabel = (value) => {
    return BANK_NAMES.find(b => b.value === value)?.label || value
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  }

  if (loading) {
    return <div className={styles.loading}>Loading vendor details...</div>
  }

  if (!vendor) {
    return (
      <div className={styles.notFound}>
        <AlertCircle size={48} />
        <h2>Vendor not found</h2>
        <button onClick={() => navigate('/vendors')}>Back to Vendors</button>
      </div>
    )
  }

  return (
    <div className={styles.viewContainer}>
      {/* Header */}
      <div className={styles.viewHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/vendors')}>
          <ArrowLeft size={18} /> Back to Vendors
        </button>
        
        <div className={styles.viewTitle}>
          <div className={styles.vendorIdBadge}>{vendor.vendorId}</div>
          <h1>{vendor.name}</h1>
          <span className={`${styles.statusBadge} ${styles[vendor.vendorStatus]}`}>
            {vendor.vendorStatus === 'active' ? (
              <><CheckCircle size={14} /> {getStatusLabel(vendor.vendorStatus)}</>
            ) : (
              <><XCircle size={14} /> {getStatusLabel(vendor.vendorStatus)}</>
            )}
          </span>
        </div>

        <div className={styles.viewActions}>
          {canEditVendor(currentUser) && (
            <button 
              className={styles.editBtn} 
              onClick={() => navigate(`/vendors/edit/${id}`)}
            >
              <Edit2 size={18} /> Edit
            </button>
          )}
          {canDeleteVendor(currentUser) && (
            <button 
              className={styles.deleteBtn} 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={18} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.viewGrid}>
        {/* Basic Information Card */}
        <div className={styles.viewCard}>
          <div className={styles.cardHeader}>
            <User size={20} color="#00d4ff" />
            <h3>Basic Information</h3>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.detailRow}>
              <label><User size={14} /> Vendor Name</label>
              <span>{vendor.name}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><Phone size={14} /> Contact Number</label>
              <span className={styles.phoneDisplay}>+92 {vendor.phone}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><CreditCard size={14} /> CNIC Number</label>
              <span className={styles.cnicDisplay}>{vendor.cnic}</span>
            </div>
            
            {/* ✅ FILER STATUS */}
            <div className={styles.detailRow}>
              <label><FileCheck size={14} /> Filer Status</label>
              <span className={`${styles.filerBadge} ${vendor.filerStatus}`}>
                {getFilerLabel(vendor.filerStatus)}
              </span>
            </div>
            
            {/* ✅ VENDOR STATUS */}
            <div className={styles.detailRow}>
              <label><CheckCircle size={14} /> Vendor Status</label>
              <span className={`${styles.badge} ${styles[vendor.vendorStatus]}`}>
                {getStatusLabel(vendor.vendorStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className={styles.viewCard}>
          <div className={styles.cardHeader}>
            <Building size={20} color="#9b59b6" />
            <h3>Bank Details</h3>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.detailRow}>
              <label><Building size={14} /> Bank Name</label>
              <span>{getBankLabel(vendor.bankName)}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><User size={14} /> Account Title</label>
              <span>{vendor.accountTitle}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><Banknote size={14} /> Account Number</label>
              <span className={styles.mono}>{vendor.accountNumber}</span>
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className={styles.viewCard}>
          <div className={styles.cardHeader}>
            <FileText size={20} color="#6bcf7f" />
            <h3>Documents</h3>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.detailRow}>
              <label>CNIC Front</label>
              {vendor.cnicFront ? (
                <div className={styles.docPreview}>
                  <img src={vendor.cnicFront} alt="CNIC Front" />
                </div>
              ) : (
                <span className={styles.noDoc}>No image uploaded</span>
              )}
            </div>
            
            <div className={styles.detailRow}>
              <label>CNIC Back</label>
              {vendor.cnicBack ? (
                <div className={styles.docPreview}>
                  <img src={vendor.cnicBack} alt="CNIC Back" />
                </div>
              ) : (
                <span className={styles.noDoc}>No image uploaded</span>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Card */}
        <div className={styles.viewCard}>
          <div className={styles.cardHeader}>
            <Calendar size={20} color="#ff8c42" />
            <h3>Account Metadata</h3>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.detailRow}>
              <label><Calendar size={14} /> Created On</label>
              <span>{formatDate(vendor.createdAt)}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><Calendar size={14} /> Last Updated</label>
              <span>{formatDate(vendor.updatedAt)}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><CheckCircle size={14} /> Vendor ID</label>
              <span className={styles.mono}>{vendor.vendorId}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><FileText size={14} /> Internal ID</label>
              <span className={styles.mono}>{vendor.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{getStatusLabel(vendor.vendorStatus)}</span>
          <span className={styles.statLabel}>Vendor Status</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{getFilerLabel(vendor.filerStatus)}</span>
          <span className={styles.statLabel}>Filer Status</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>+92 {vendor.phone}</span>
          <span className={styles.statLabel}>Contact</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.deleteModalHeader}>
              <AlertCircle size={32} color="#ff6b6b" />
              <h3>⚠️ Delete Vendor</h3>
            </div>
            <div className={styles.deleteModalBody}>
              <p>Are you sure you want to delete <strong>{vendor.name}</strong>?</p>
              <p className={styles.warning}>This action cannot be undone.</p>
            </div>
            <div className={styles.deleteModalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>
                <Trash2 size={16} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorView