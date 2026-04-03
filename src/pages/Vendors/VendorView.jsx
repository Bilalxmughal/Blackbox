import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Truck, User, Phone, CreditCard, FileText,
  Calendar, Edit2, Trash2, AlertCircle, CheckCircle, XCircle,
  Building, Banknote, FileCheck, Briefcase
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
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase()
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

      {/* Top bar */}
      <div className={styles.viewTopbar}>
        <button className={styles.backBtn} onClick={() => navigate('/vendors')}>
          <ArrowLeft size={14} />
          Back to vendors
        </button>
        <div className={styles.viewActions}>
          {canEditVendor(currentUser) && (
            <button
              className={styles.editBtn}
              onClick={() => navigate(`/vendors/edit/${id}`)}
            >
              <Edit2 size={13} /> Edit
            </button>
          )}
          {canDeleteVendor(currentUser) && (
            <button
              className={styles.deleteBtn}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className={styles.heroCard}>
        <div className={styles.heroAvatar}>
          {getInitials(vendor.name)}
        </div>
        <div className={styles.heroInfo}>
          <div className={styles.heroName}>{vendor.name}</div>
          <div className={styles.heroMeta}>
            <span className={`${styles.statusPill} ${styles[vendor.vendorStatus]}`}>
              <span className={styles.statusDot} />
              {vendor.vendorStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
            <span className={styles.idPill}>{vendor.vendorId}</span>
          </div>
        </div>
      </div>

      {/* Basic Info Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoCardHead}>
          <span className={`${styles.cardIcon} ${styles.iconBlue}`}>
            <User size={13} />
          </span>
          <span>Basic Information</span>
        </div>
        <div className={styles.infoCardBody}>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Vendor name</span>
            <span className={styles.rowVal}>{vendor.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Contact number</span>
            <span className={`${styles.rowVal} ${styles.phoneDisplay}`}>+92 {vendor.phone}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>CNIC number</span>
            <span className={`${styles.rowVal} ${styles.cnicDisplay}`}>{vendor.cnic}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Filer status</span>
            <span className={styles.rowVal}>
              <span className={`${styles.filerBadge} ${vendor.filerStatus}`}>
                {getFilerLabel(vendor.filerStatus)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Bank Details Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoCardHead}>
          <span className={`${styles.cardIcon} ${styles.iconPurple}`}>
            <Building size={13} />
          </span>
          <span>Bank Details</span>
        </div>
        <div className={styles.infoCardBody}>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Bank name</span>
            <span className={styles.rowVal}>{getBankLabel(vendor.bankName)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Account title</span>
            <span className={styles.rowVal}>{vendor.accountTitle}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Account number</span>
            <span className={`${styles.rowVal} ${styles.monoTag}`}>{vendor.accountNumber}</span>
          </div>
        </div>
      </div>

      {/* Documents Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoCardHead}>
          <span className={`${styles.cardIcon} ${styles.iconOrange}`}>
            <FileText size={13} />
          </span>
          <span>Documents</span>
        </div>
        <div className={styles.infoCardBody}>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>CNIC Front</span>
            <span className={styles.rowVal}>
              {vendor.cnicFront ? (
                <div className={styles.docPreview}>
                  <img src={vendor.cnicFront} alt="CNIC Front" />
                </div>
              ) : (
                <span className={styles.noDoc}>No image uploaded</span>
              )}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>CNIC Back</span>
            <span className={styles.rowVal}>
              {vendor.cnicBack ? (
                <div className={styles.docPreview}>
                  <img src={vendor.cnicBack} alt="CNIC Back" />
                </div>
              ) : (
                <span className={styles.noDoc}>No image uploaded</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoCardHead}>
          <span className={`${styles.cardIcon} ${styles.iconGreen}`}>
            <Calendar size={13} />
          </span>
          <span>Metadata</span>
        </div>
        <div className={styles.infoCardBody}>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Created on</span>
            <span className={styles.rowVal}>{formatDate(vendor.createdAt)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Last updated</span>
            <span className={styles.rowVal}>{formatDate(vendor.updatedAt)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Vendor ID</span>
            <span className={styles.rowVal}>
              <span className={styles.monoTag}>{vendor.vendorId}</span>
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Internal ID</span>
            <span className={styles.rowVal}>
              <span className={styles.monoTag}>{vendor.id}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.deleteModalHeader}>
              <AlertCircle size={28} />
              <h3>Delete vendor</h3>
            </div>
            <div className={styles.deleteModalBody}>
              <p>Are you sure you want to permanently delete <strong>{vendor.name}</strong>?</p>
              <p className={styles.deleteWarningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.deleteModalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>
                <Trash2 size={14} /> Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorView