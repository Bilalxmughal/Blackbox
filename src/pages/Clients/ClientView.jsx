import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Building2, User, Mail, MapPin,
  Briefcase, Calendar, Edit2, Trash2, AlertCircle,
  FileText, CheckCircle, XCircle
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
        const saved = localStorage.getItem('clients')
        const clients = saved ? JSON.parse(saved) : []
        const found = clients.find(c => c.id === id)

        if (found) {
          setClient(found)
        } else {
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

  const getLabel = (value, options) =>
    options.find(o => o.value === value)?.label || value

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

      {/* Top bar */}
      <div className={styles.viewTopbar}>
        <button className={styles.backBtn} onClick={() => navigate('/clients')}>
          <ArrowLeft size={14} />
          Back to clients
        </button>
        <div className={styles.viewActions}>
          {canEditClient(currentUser) && (
            <button
              className={styles.editBtn}
              onClick={() => navigate(`/clients/edit/${id}`)}
            >
              <Edit2 size={13} /> Edit
            </button>
          )}
          {canDeleteClient(currentUser) && (
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
          {getInitials(client.legalName)}
        </div>
        <div className={styles.heroInfo}>
          <div className={styles.heroName}>{client.legalName}</div>
          <div className={styles.heroMeta}>
            <span className={`${styles.statusPill} ${styles[client.status]}`}>
              <span className={styles.statusDot} />
              {client.status === 'active' ? 'Active' : 'Inactive'}
            </span>
            <span className={styles.idPill}>{client.clientId}</span>
          </div>
        </div>
      </div>

      {/* Company Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoCardHead}>
          <span className={`${styles.cardIcon} ${styles.iconBlue}`}>
            <Building2 size={13} />
          </span>
          <span>Company</span>
        </div>
        <div className={styles.infoCardBody}>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Legal name</span>
            <span className={styles.rowVal}>{client.legalName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Industry</span>
            <span className={styles.rowVal}>
              <span className={styles.badgeIndustry}>
                {getLabel(client.industry, INDUSTRIES)}
              </span>
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Business type</span>
            <span className={styles.rowVal}>
              <span className={`${styles.badgeBiz} ${styles[client.businessType]}`}>
                {getLabel(client.businessType, BUSINESS_TYPES)}
              </span>
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Location</span>
            <span className={styles.rowVal}>
              {getLabel(client.location, CLIENT_LOCATIONS)}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Billing address</span>
            <span className={`${styles.rowVal} ${styles.addressVal}`}>
              {client.billingAddress}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoCardHead}>
          <span className={`${styles.cardIcon} ${styles.iconPurple}`}>
            <User size={13} />
          </span>
          <span>Contact</span>
        </div>
        <div className={styles.infoCardBody}>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>POC name</span>
            <span className={styles.rowVal}>{client.pocName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>POC email</span>
            <a href={`mailto:${client.pocEmail}`} className={styles.rowLink}>
              {client.pocEmail}
            </a>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Account manager</span>
            <span className={styles.rowVal}>{client.accountManager}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Manager email</span>
            <a href={`mailto:${client.accountManagerEmail}`} className={styles.rowLink}>
              {client.accountManagerEmail}
            </a>
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
            <span className={styles.rowVal}>{formatDate(client.createdAt)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Last updated</span>
            <span className={styles.rowVal}>{formatDate(client.updatedAt)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Client ID</span>
            <span className={styles.rowVal}>
              <span className={styles.monoTag}>{client.clientId}</span>
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.rowLabel}>Internal ID</span>
            <span className={styles.rowVal}>
              <span className={styles.monoTag}>{client.id}</span>
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
              <h3>Delete client</h3>
            </div>
            <div className={styles.deleteModalBody}>
              <p>Are you sure you want to permanently delete <strong>{client.legalName}</strong>?</p>
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

export default ClientView