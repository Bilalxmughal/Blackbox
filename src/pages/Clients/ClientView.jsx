import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, Building2, User, Mail, MapPin, 
  Briefcase, Calendar, Edit2, Trash2, AlertCircle,
  Phone, FileText, CheckCircle, XCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getClientById, deleteClient } from '../../lib/firebase'
import { 
  CLIENT_LOCATIONS, 
  BUSINESS_TYPES, 
  INDUSTRIES,
  canEditClient,
  canDeleteClient
} from '../../data/clientConfig'
import styles from './Clients.module.css'

function ClientView() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const loadClient = async () => {
      setLoading(true)
      try {
        // Try localStorage first
        const saved = localStorage.getItem('clients')
        const clients = saved ? JSON.parse(saved) : []
        const found = clients.find(c => c.id === id)
        
        if (found) {
          setClient(found)
        } else {
          // Try Firebase
          const result = await getClientById(id)
          if (result.success) {
            setClient(result.data)
          } else {
            alert('Client not found!')
            navigate('/clients')
          }
        }
      } catch (error) {
        console.error('Error loading client:', error)
        alert('Failed to load client details')
      } finally {
        setLoading(false)
      }
    }
    
    loadClient()
  }, [id, navigate])

  const handleDelete = async () => {
    if (!canDeleteClient(currentUser)) {
      alert('Only Super Admin can delete clients!')
      return
    }

    const userInput = prompt(`Type "DELETE" to permanently remove ${client.legalName}:`)
    if (userInput !== 'DELETE') {
      alert('Delete cancelled.')
      return
    }

    try {
      if (client.id && !client.id.startsWith('cli-')) {
        await deleteClient(client.id)
      }
      
      const saved = localStorage.getItem('clients')
      const clients = saved ? JSON.parse(saved) : []
      const updated = clients.filter(c => c.id !== id)
      localStorage.setItem('clients', JSON.stringify(updated))
      
      alert('Client deleted successfully!')
      navigate('/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client')
    }
  }

  const getLabel = (value, options) => {
    return options.find(o => o.value === value)?.label || value
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  }

  if (loading) {
    return <div className={styles.loading}>Loading client details...</div>
  }

  if (!client) {
    return (
      <div className={styles.notFound}>
        <AlertCircle size={48} />
        <h2>Client not found</h2>
        <button onClick={() => navigate('/clients')}>Back to Clients</button>
      </div>
    )
  }

  return (
    <div className={styles.viewContainer}>
      {/* Header */}
      <div className={styles.viewHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/clients')}>
          <ArrowLeft size={18} /> Back to Clients
        </button>
        
        <div className={styles.viewTitle}>
          <div className={styles.clientIdBadge}>{client.clientId}</div>
          <h1>{client.legalName}</h1>
          <span className={`${styles.statusBadge} ${styles[client.status]}`}>
            {client.status === 'active' ? (
              <><CheckCircle size={14} /> Active</>
            ) : (
              <><XCircle size={14} /> Inactive</>
            )}
          </span>
        </div>

        <div className={styles.viewActions}>
          {canEditClient(currentUser) && (
            <button 
              className={styles.editBtn} 
              onClick={() => navigate(`/clients/edit/${id}`)}
            >
              <Edit2 size={18} /> Edit
            </button>
          )}
          {canDeleteClient(currentUser) && (
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
        {/* Company Information Card */}
        <div className={styles.viewCard}>
          <div className={styles.cardHeader}>
            <Building2 size={20} color="#00d4ff" />
            <h3>Company Information</h3>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.detailRow}>
              <label><Building2 size={14} /> Legal Name</label>
              <span>{client.legalName}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><Briefcase size={14} /> Industry</label>
              <span className={styles.badge}>{getLabel(client.industry, INDUSTRIES)}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><MapPin size={14} /> Location</label>
              <span>{getLabel(client.location, CLIENT_LOCATIONS)}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><Briefcase size={14} /> Business Type</label>
              <span className={`${styles.badge} ${styles[client.businessType]}`}>
                {getLabel(client.businessType, BUSINESS_TYPES)}
              </span>
            </div>
            
            <div className={styles.detailRow}>
              <label><FileText size={14} /> Billing Address</label>
              <span className={styles.address}>{client.billingAddress}</span>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className={styles.viewCard}>
          <div className={styles.cardHeader}>
            <User size={20} color="#9b59b6" />
            <h3>Contact Information</h3>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.detailRow}>
              <label><User size={14} /> POC Name</label>
              <span>{client.pocName}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><Mail size={14} /> POC Email</label>
              <a href={`mailto:${client.pocEmail}`} className={styles.link}>
                {client.pocEmail}
              </a>
            </div>
            
            <div className={styles.detailRow}>
              <label><User size={14} /> Account Manager</label>
              <span>{client.accountManager}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><Mail size={14} /> Manager Email</label>
              <a href={`mailto:${client.accountManagerEmail}`} className={styles.link}>
                {client.accountManagerEmail}
              </a>
            </div>
          </div>
        </div>

        {/* Metadata Card */}
        <div className={styles.viewCard}>
          <div className={styles.cardHeader}>
            <Calendar size={20} color="#6bcf7f" />
            <h3>Account Metadata</h3>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.detailRow}>
              <label><Calendar size={14} /> Created On</label>
              <span>{formatDate(client.createdAt)}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><Calendar size={14} /> Last Updated</label>
              <span>{formatDate(client.updatedAt)}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><CheckCircle size={14} /> Client ID</label>
              <span className={styles.mono}>{client.clientId}</span>
            </div>
            
            <div className={styles.detailRow}>
              <label><FileText size={14} /> Internal ID</label>
              <span className={styles.mono}>{client.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{client.status === 'active' ? 'Active' : 'Inactive'}</span>
          <span className={styles.statLabel}>Account Status</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{getLabel(client.businessType, BUSINESS_TYPES)}</span>
          <span className={styles.statLabel}>Business Model</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{getLabel(client.location, CLIENT_LOCATIONS)}</span>
          <span className={styles.statLabel}>Base Location</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.deleteModalHeader}>
              <AlertCircle size={32} color="#ff6b6b" />
              <h3>⚠️ Delete Client</h3>
            </div>
            <div className={styles.deleteModalBody}>
              <p>Are you sure you want to delete <strong>{client.legalName}</strong>?</p>
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

export default ClientView