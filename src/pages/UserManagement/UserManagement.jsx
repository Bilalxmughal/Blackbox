import { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  UserCheck, 
  UserX, 
  Search, 
  Filter,
  Download,
  Users,
  UserCog,
  Shield,
  MoreVertical,
  Eye
} from 'lucide-react'
import { 
  ROLES, 
  defaultUsers, 
  defaultDepartments,
  getPendingRequests,
  savePendingRequest,
  canManageUser,
  hasPermission
} from '../../data/users'
import { useAuth } from '../../context/AuthContext'
import styles from './UserManagement.module.css'

// ✅ FIREBASE IMPORTS
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser as deleteUserFromFirebase 
} from '../../lib/firebase'

function UserManagement() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  
  // UI States
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    role: 'user',
    status: 'active'
  })

  // ✅ Load data from localStorage (fast) + background Firebase sync
  useEffect(() => {
    const loadData = () => {
      // Pehle localStorage se load karo (instant)
      const savedUsers = localStorage.getItem('users')
      const savedDepts = localStorage.getItem('departments')
      
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers)
          if (Array.isArray(parsed)) {
            setUsers(parsed)
          }
        } catch (e) {
          console.error('Error parsing users:', e)
          setUsers(defaultUsers)
          localStorage.setItem('users', JSON.stringify(defaultUsers))
        }
      } else {
        setUsers(defaultUsers)
        localStorage.setItem('users', JSON.stringify(defaultUsers))
      }
      
      setDepartments(savedDepts ? JSON.parse(savedDepts) : defaultDepartments)
      setRequests(getPendingRequests())
    }

    loadData()
    
    // Background mein Firebase se sync karo
    const syncWithFirebase = async () => {
      try {
        const result = await getAllUsers()
        if (result.success && result.data.length > 0) {
          setUsers(result.data)
          localStorage.setItem('users', JSON.stringify(result.data))
        }
      } catch (error) {
        console.log('Firebase sync failed:', error)
      }
    }
    
    syncWithFirebase()
    
    const interval = setInterval(syncWithFirebase, 30000)
    return () => clearInterval(interval)
  }, [])

  // Save functions
  const saveUsers = (updated) => {
    setUsers(updated)
    localStorage.setItem('users', JSON.stringify(updated))
  }

  // Check permissions
  const canAddUser = hasPermission(currentUser, 'add_user') || currentUser?.role === 'ops'
  const canEditUser = (targetUser) => canManageUser(currentUser, targetUser)
  const canDeleteUser = (targetUser) => {
    if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'admin') return false
    return canManageUser(currentUser, targetUser)
  }
  const canChangeRole = currentUser?.role === 'super_admin'

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      
      const matchesRole = filterRole === 'all' || user.role === filterRole
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus
      const matchesDept = filterDept === 'all' || user.department === filterDept
      
      return matchesSearch && matchesRole && matchesStatus && matchesDept
    })
  }, [users, searchTerm, filterRole, filterStatus, filterDept])

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    byRole: {
      super_admin: users.filter(u => u.role === 'super_admin').length,
      admin: users.filter(u => u.role === 'admin').length,
      ops: users.filter(u => u.role === 'ops').length,
      user: users.filter(u => u.role === 'user').length
    }
  }), [users])

  // Handlers
  const openAddModal = () => {
    setModalMode('add')
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      department: departments[0]?.name || '',
      role: 'user',
      status: 'active'
    })
    setShowModal(true)
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setModalMode('edit')
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      department: user.department,
      role: user.role,
      status: user.status || 'active'
    })
    setShowModal(true)
  }

  const openViewModal = (user) => {
    setSelectedUser(user)
    setModalMode('view')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
  }

  // ✅ HANDLE SUBMIT - Pehle localStorage, phir Firebase
  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill all required fields')
      return
    }

    setLoading(true)

    try {
      if (modalMode === 'add') {
        // Check if email exists
        if (users.some(u => u.email === formData.email)) {
          alert('Email already exists!')
          setLoading(false)
          return
        }

        // OPS needs to request
        if (currentUser?.role === 'ops') {
          savePendingRequest({
            type: 'add_user',
            data: formData,
            requestedBy: currentUser.id,
            requestedByName: currentUser.name
          })
          alert('Request sent to Super Admin for approval!')
          closeModal()
          setLoading(false)
          return
        }

        // ✅ PEHLE LOCALSTORAGE MEIN ADD KARO (instant)
        const newUser = {
          id: `user-${Date.now()}`, // Local ID banao
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || 'password123',
          department: formData.department,
          role: formData.role,
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: null
        }

        const updatedUsers = [...users, newUser]
        saveUsers(updatedUsers)
        
        // ✅ PHIR BACKGROUND MEIN FIREBASE MEIN SAVE KARO
        try {
          const firebaseResult = await createUser(newUser)
          if (firebaseResult.success) {
            // Update local ID with Firebase ID
            const finalUsers = updatedUsers.map(u => 
              u.id === newUser.id ? { ...u, id: firebaseResult.id } : u
            )
            saveUsers(finalUsers)
            console.log('User saved to Firebase:', firebaseResult.id)
          }
        } catch (firebaseError) {
          console.error('Firebase save failed (non-critical):', firebaseError)
        }

        alert('User created successfully!')
        closeModal()
        
      } else if (modalMode === 'edit' && selectedUser) {
        const isRoleChanged = formData.role !== selectedUser.role
        
        if (isRoleChanged && !canChangeRole) {
          alert('Only Super Admin can change roles!')
          setLoading(false)
          return
        }

        // OPS needs to request for edit
        if (currentUser?.role === 'ops') {
          savePendingRequest({
            type: 'edit_user',
            userId: selectedUser.id,
            data: { updates: formData },
            requestedBy: currentUser.id,
            requestedByName: currentUser.name
          })
          alert('Edit request sent to Super Admin!')
          closeModal()
          setLoading(false)
          return
        }

        // ✅ PEHLE LOCALSTORAGE UPDATE KARO
        const updated = users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, ...formData, password: formData.password || u.password }
            : u
        )
        saveUsers(updated)

        // ✅ PHIR FIREBASE UPDATE KARO (background mein)
        if (selectedUser.id && !selectedUser.id.startsWith('user-')) {
          try {
            await updateUser(selectedUser.id, {
              name: formData.name,
              phone: formData.phone,
              department: formData.department,
              role: formData.role,
              status: formData.status
            })
          } catch (firebaseError) {
            console.error('Firebase update failed:', firebaseError)
          }
        }

        alert('User updated successfully!')
        closeModal()
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('Operation failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = (user) => {
    if (currentUser?.role === 'ops') {
      savePendingRequest({
        type: 'toggle_status',
        userId: user.id,
        currentStatus: user.status,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name
      })
      alert('Status change request sent!')
      return
    }

    if (!canEditUser(user)) {
      alert('You cannot modify this user!')
      return
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const updated = users.map(u => 
      u.id === user.id ? { ...u, status: newStatus } : u
    )
    saveUsers(updated)

    // Background Firebase update
    if (user.id && !user.id.startsWith('user-')) {
      updateUser(user.id, { status: newStatus }).catch(console.error)
    }
  }

  const deleteUser = (user) => {
    if (!canDeleteUser(user)) {
      alert('You cannot delete this user!')
      return
    }

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      // Pehle localStorage se delete karo
      const updated = users.filter(u => u.id !== user.id)
      saveUsers(updated)

      // Phir Firebase se delete karo (background mein)
      if (user.id && !user.id.startsWith('user-')) {
        deleteUserFromFirebase(user.id).catch(console.error)
      }
    }
  }

  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Department', 'Role', 'Status', 'Created'].join(','),
      ...filteredUsers.map(u => [
        u.name, u.email, u.phone, u.department, u.role, u.status, 
        new Date(u.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading && users.length === 0) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div>Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>User Management</h1>
          <p>Manage system users, roles and permissions</p>
        </div>
        {canAddUser && (
          <button className={styles.addBtn} onClick={openAddModal} disabled={loading}>
            <Plus size={18} /> Add User
          </button>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Users size={24} color="#00d4ff" />
          <div>
            <span className={styles.statNumber}>{stats.total}</span>
            <span className={styles.statLabel}>Total Users</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <UserCheck size={24} color="#6bcf7f" />
          <div>
            <span className={styles.statNumber}>{stats.active}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <UserX size={24} color="#ff6b6b" />
          <div>
            <span className={styles.statNumber}>{stats.inactive}</span>
            <span className={styles.statLabel}>Inactive</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Shield size={24} color="#9b59b6" />
          <div>
            <span className={styles.statNumber}>{stats.byRole.super_admin + stats.byRole.admin}</span>
            <span className={styles.statLabel}>Admins</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            {Object.values(ROLES).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <button className={styles.exportBtn} onClick={exportUsers}>
          <Download size={16} /> Export
        </button>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={user.status === 'inactive' ? styles.inactive : ''}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>{user.phone || '-'}</td>
                <td>
                  <span className={styles.deptBadge}>{user.department}</span>
                </td>
                <td>
                  <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                    {ROLES[user.role?.toUpperCase()]?.name || user.role}
                  </span>
                </td>
                <td>
                  <button 
                    className={`${styles.statusToggle} ${styles[user.status]}`}
                    onClick={() => toggleStatus(user)}
                    disabled={!canEditUser(user) || loading}
                  >
                    {user.status === 'active' ? (
                      <><UserCheck size={14} /> Active</>
                    ) : (
                      <><UserX size={14} /> Inactive</>
                    )}
                  </button>
                </td>
                <td className={styles.dateCell}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => openViewModal(user)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {canEditUser(user) && (
                      <button 
                        className={styles.actionBtn}
                        onClick={() => openEditModal(user)}
                        title="Edit User"
                        disabled={loading}
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    
                    {canDeleteUser(user) && (
                      <button 
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => deleteUser(user)}
                        title="Delete User"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={48} color="#ddd" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === 'add' && <><Plus size={20} /> Add New User</>}
                {modalMode === 'edit' && <><Edit2 size={20} /> Edit User</>}
                {modalMode === 'view' && <><Eye size={20} /> User Details</>}
              </h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <div className={styles.viewDetails}>
                  <div className={styles.detailRow}>
                    <label>Name</label>
                    <span>{selectedUser?.name}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <label>Email</label>
                    <span>{selectedUser?.email}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <label>Phone</label>
                    <span>{selectedUser?.phone || '-'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <label>Department</label>
                    <span>{selectedUser?.department}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <label>Role</label>
                    <span className={`${styles.roleBadge} ${styles[selectedUser?.role]}`}>
                      {ROLES[selectedUser?.role?.toUpperCase()]?.name}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <label>Status</label>
                    <span className={styles[selectedUser?.status]}>
                      {selectedUser?.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <label>Created</label>
                    <span>{new Date(selectedUser?.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={modalMode === 'view' || loading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={modalMode === 'edit' || loading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={loading}
                    />
                  </div>

                  {modalMode === 'add' && (
                    <div className={styles.formGroup}>
                      <label>Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Leave empty for default"
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label>Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      disabled={loading}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      disabled={!canChangeRole || loading}
                    >
                      {Object.values(ROLES).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    {!canChangeRole && (
                      <small className={styles.hint}>Only Super Admin can change roles</small>
                    )}
                  </div>

                  {modalMode === 'edit' && (
                    <div className={styles.formGroup}>
                      <label>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        disabled={loading}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {modalMode !== 'view' && (
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={closeModal} disabled={loading}>
                  Cancel
                </button>
                <button 
                  className={styles.saveBtn} 
                  onClick={handleSubmit}
                  disabled={currentUser?.role === 'ops' && modalMode === 'add' || loading}
                >
                  {loading ? 'Saving...' : currentUser?.role === 'ops' ? 'Send Request' : 'Save User'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement