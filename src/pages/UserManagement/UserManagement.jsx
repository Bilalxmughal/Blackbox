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
  Key,
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
import { getAllUsers } from '../../lib/firebase'

// Firebase imports for background sync
import { 
  createUser as createUserInFirebase, 
  updateUser as updateUserInFirebase, 
  deleteUser as deleteUserFromFirebase 
} from '../../lib/firebase'

function UserManagement() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [requests, setRequests] = useState([])
  
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

  // Load data instantly from localStorage on mount
  useEffect(() => {
  const loadData = async () => {
    const savedUsers = localStorage.getItem('users')
    const savedDepts = localStorage.getItem('departments')

    // ✅ STEP 1: Load from localStorage first (fast UI)
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers)
        if (Array.isArray(parsed)) {
          setUsers(parsed)
        }
      } catch (e) {
        console.error('Error parsing users:', e)
        setUsers(defaultUsers)
      }
    } else {
      setUsers(defaultUsers)
    }

    setDepartments(savedDepts ? JSON.parse(savedDepts) : defaultDepartments)
    setRequests(getPendingRequests())

    // ✅ STEP 2: Sync from Firebase (REAL FIX)
    try {
      const res = await getAllUsers()
      if (res.success && res.data.length > 0) {
        setUsers(res.data)
        localStorage.setItem('users', JSON.stringify(res.data))
      }
    } catch (err) {
      console.error("Firebase sync failed:", err)
    }
  }

  loadData()
}, [])

  // Save users to localStorage and update state
  const saveUsers = (updated) => {
    setUsers(updated)
    localStorage.setItem('users', JSON.stringify(updated))
  }

  // Check permissions based on current user role
  const canAddUser = hasPermission(currentUser, 'add_user') || currentUser?.role === 'ops'
  const canEditUser = (targetUser) => canManageUser(currentUser, targetUser)
  const canDeleteUser = (targetUser) => {
    if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'admin') return false
    return canManageUser(currentUser, targetUser)
  }
  const canChangeRole = currentUser?.role === 'super_admin'

  // Filter users based on search and filters
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

  // Calculate statistics
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

  // Open modal for adding new user
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

  // Open modal for editing user
  const openEditModal = (user) => {
  setSelectedUser(user)
  setModalMode('edit')
  setFormData({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    department: user.department || '',
    role: user.role || 'user',
    status: user.status || 'active',
    resetPassword: false  // ✅ Yeh add karo
  })
  setShowModal(true)
}
  // Open modal for viewing user details
  const openViewModal = (user) => {
    setSelectedUser(user)
    setModalMode('view')
    setShowModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
  }

  // Handle form submit - INSTANT local save, background Firebase sync
  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill all required fields')
      return
    }

    if (modalMode === 'add') {
      // Check for duplicate email
      if (users.some(u => u.email === formData.email)) {
        alert('Email already exists!')
        return
      }

      // OPS users need approval for new users
      if (currentUser?.role === 'ops') {
        savePendingRequest({
          type: 'add_user',
          data: formData,
          requestedBy: currentUser.id,
          requestedByName: currentUser.name
        })
        alert('Request sent to Super Admin for approval!')
        closeModal()
        return
      }

      // INSTANT: Create user locally first (no waiting)
      const newUser = {
        id: `user-${Date.now()}`, // Generate local ID
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

      // Update local state immediately
      const updatedUsers = [...users, newUser]
      saveUsers(updatedUsers)
      
      // BACKGROUND: Sync to Firebase silently (no blocking)
      setTimeout(() => {
        createUserInFirebase(newUser).then(result => {
          if (result.success) {
            // Update local ID with Firebase ID
            const finalUsers = updatedUsers.map(u => 
              u.id === newUser.id ? { ...u, id: result.id } : u
            )
            saveUsers(finalUsers)
          }
        }).catch(() => {
          // Silent fail - will retry later
        })
      }, 0)

      alert('User created successfully!')
      closeModal()
      
    } else if (modalMode === 'edit' && selectedUser) {
      // Check role change permission
      const isRoleChanged = formData.role !== selectedUser.role
      
      if (isRoleChanged && !canChangeRole) {
        alert('Only Super Admin can change roles!')
        return
      }

      // OPS users need approval for edits
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
        return
      }

      // INSTANT: Update locally first
      const updated = users.map(u => 
  u.id === selectedUser.id 
    ? { 
        ...u, 
        name: formData.name,
        email: formData.email,   // ✅ ADD THIS
        phone: formData.phone,
        department: formData.department,
        role: formData.role,
        status: formData.status,
        ...(formData.resetPassword && formData.password && { password: formData.password })
      }
    : u
)
saveUsers(updated)

      // BACKGROUND: Update in Firebase silently
      if (selectedUser.id && !selectedUser.id.startsWith('user-')) {
  setTimeout(() => {
    const firebaseUpdates = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      role: formData.role,
      status: formData.status
    }
    // ✅ SIRF JAB RESET CHECKED HO TAB PASSWORD BHEJO
    if (formData.resetPassword && formData.password) {
      firebaseUpdates.password = formData.password
    }
    
    updateUserInFirebase(selectedUser.id, firebaseUpdates).catch(() => {})
  }, 0)
}

      alert('User updated successfully!')
      closeModal()
    }
  }

  // Toggle user status (active/inactive)
  const toggleStatus = (user) => {
    // OPS users need approval for status changes
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

    // INSTANT: Toggle locally
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const updated = users.map(u => 
      u.id === user.id ? { ...u, status: newStatus } : u
    )
    saveUsers(updated)

    // BACKGROUND: Update in Firebase
    if (user.id && !user.id.startsWith('user-')) {
      setTimeout(() => {
        updateUserInFirebase(user.id, { status: newStatus }).catch(() => {})
      }, 0)
    }
  }

  // Delete user
  const deleteUser = (user) => {
    if (!canDeleteUser(user)) {
      alert('You cannot delete this user!')
      return
    }

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      // INSTANT: Delete locally
      const updated = users.filter(u => u.id !== user.id)
      saveUsers(updated)

      // BACKGROUND: Delete from Firebase
      if (user.id && !user.id.startsWith('user-')) {
        setTimeout(() => {
          deleteUserFromFirebase(user.id).catch(() => {})
        }, 0)
      }
    }
  }

  // Export users to CSV
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>User Management</h1>
          <p>Manage system users, roles and permissions</p>
        </div>
        {canAddUser && (
          <button className={styles.addBtn} onClick={openAddModal}>
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
                    disabled={!canEditUser(user)}
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
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    
                    {canDeleteUser(user) && (
                      <button 
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => deleteUser(user)}
                        title="Delete User"
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
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                      />
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label>Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
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
                      disabled={!canChangeRole}
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
  <>
    <div className={styles.formGroup}>
      <label>Status</label>
      <select
        value={formData.status}
        onChange={(e) => setFormData({...formData, status: e.target.value})}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    {/* ✅ PASSWORD RESET SECTION - YEH ADD KARO */}
    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
      <div className={styles.passwordResetBox}>
        <label className={styles.resetLabel}>
          <input
            type="checkbox"
            checked={formData.resetPassword}
            onChange={(e) => setFormData({
              ...formData, 
              resetPassword: e.target.checked,
              password: e.target.checked ? formData.password : ''
            })}
          />
          <Key size={16} />
          <span>Reset Password</span>
        </label>
      </div>
    </div>

    {formData.resetPassword && (
      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
        <label>New Password *</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder="Enter new password"
          required
        />
        <small className={styles.hint}>
          User will need to login with this new password
        </small>
      </div>
    )}
  </>
)}
                </div>
              )}
            </div>

            {modalMode !== 'view' && (
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={closeModal}>
                  Cancel
                </button>
                <button 
                  className={styles.saveBtn} 
                  onClick={handleSubmit}
                  disabled={currentUser?.role === 'ops' && modalMode === 'add'}
                >
                  {currentUser?.role === 'ops' ? 'Send Request' : 'Save User'}
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