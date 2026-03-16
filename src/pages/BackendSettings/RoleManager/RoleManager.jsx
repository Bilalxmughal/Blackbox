import { useState } from 'react'
import { Shield, Check, X, AlertCircle, Users } from 'lucide-react'
import { ROLES, getPendingRequests, updateRequestStatus } from '../../../data/users'
import { useAuth } from '../../../context/AuthContext'
import styles from './RoleManager.module.css'

function RoleManager() {
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState(() => getPendingRequests())
  const [activeRole, setActiveRole] = useState('SUPER_ADMIN')

  // Only Super Admin can access this
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className={styles.noAccess}>
        <AlertCircle size={48} color="#ff6b6b" />
        <h3>Access Denied</h3>
        <p>Only Super Admin can manage roles and permissions.</p>
      </div>
    )
  }

  const handleRequestAction = (requestId, action) => {
    const request = requests.find(r => r.id === requestId)
    
    if (action === 'approve') {
      // Execute the requested action
      const users = JSON.parse(localStorage.getItem('users')) || []
      
      switch(request.type) {
        case 'role_change':
        case 'add_user':
          if (request.data.id) {
            // Edit existing user
            const updated = users.map(u => 
              u.id === request.data.id ? { ...u, ...request.data.updates } : u
            )
            localStorage.setItem('users', JSON.stringify(updated))
          } else {
            // Add new user
            const newUser = {
              id: `user-${Date.now()}`,
              ...request.data,
              status: 'active',
              createdAt: new Date().toISOString()
            }
            localStorage.setItem('users', JSON.stringify([...users, newUser]))
          }
          break
          
        default:
          break
      }
    }
    
    updateRequestStatus(requestId, action === 'approve' ? 'approved' : 'rejected')
    setRequests(getPendingRequests())
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Role & Permission Management</h2>
          <p>Manage access levels and approve role change requests</p>
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className={styles.requestsSection}>
          <h3>
            <AlertCircle size={18} color="#ffa726" />
            Pending Requests ({pendingRequests.length})
          </h3>
          
          <div className={styles.requestsList}>
            {pendingRequests.map(req => (
              <div key={req.id} className={styles.requestCard}>
                <div className={styles.requestInfo}>
                  <span className={styles.reqType}>{req.type.replace(/_/g, ' ').toUpperCase()}</span>
                  <p className={styles.reqDetail}>
                    <strong>From:</strong> {req.requestedByName}
                  </p>
                  <p className={styles.reqDetail}>
                    <strong>Requested:</strong> {new Date(req.createdAt).toLocaleString()}
                  </p>
                  {req.data && (
                    <div className={styles.reqData}>
                      <p>User: {req.data.name || req.data.updates?.name}</p>
                      <p>Role: {req.data.role || req.data.updates?.role}</p>
                      <p>Department: {req.data.department || req.data.updates?.department}</p>
                    </div>
                  )}
                </div>
                
                <div className={styles.requestActions}>
                  <button 
                    className={styles.approveBtn}
                    onClick={() => handleRequestAction(req.id, 'approve')}
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button 
                    className={styles.rejectBtn}
                    onClick={() => handleRequestAction(req.id, 'reject')}
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roles Overview */}
      <div className={styles.rolesSection}>
        <h3>Role Permissions Overview</h3>
        
        <div className={styles.roleTabs}>
          {Object.keys(ROLES).map(roleKey => (
            <button
              key={roleKey}
              className={`${styles.roleTab} ${activeRole === roleKey ? styles.active : ''}`}
              onClick={() => setActiveRole(roleKey)}
            >
              {ROLES[roleKey].name}
            </button>
          ))}
        </div>

        <div className={styles.roleDetail}>
          <div className={styles.roleHeader}>
            <Shield size={32} color="#00d4ff" />
            <div>
              <h4>{ROLES[activeRole].name}</h4>
              <p>{ROLES[activeRole].description}</p>
            </div>
            <span className={styles.levelBadge}>Level {ROLES[activeRole].level}</span>
          </div>

          <div className={styles.permissionsList}>
            <h5>Permissions:</h5>
            <ul>
              {ROLES[activeRole].permissions.map((perm, idx) => (
                <li key={idx}>
                  <Check size={14} color="#6bcf7f" />
                  {perm === 'all' 
                    ? 'Full System Access (All Permissions)' 
                    : perm.replace(/_/g, ' ').toUpperCase()}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.roleInfo}>
            <Users size={16} />
            <span>
              {JSON.parse(localStorage.getItem('users') || '[]')
                .filter(u => u.role === ROLES[activeRole].id).length} users with this role
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleManager