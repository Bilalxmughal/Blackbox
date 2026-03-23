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
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit', 'view'
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

  // ✅ Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Users from Firebase
        const usersResult = await getAllUsers()
        if (usersResult.success) {
          setUsers(usersResult.data)
          // Sync to localStorage for backup
          localStorage.setItem('users', JSON.stringify(usersResult.data))
        } else {
          // Fallback to localStorage
          const savedUsers = localStorage.getItem('users')
          setUsers(savedUsers ? JSON.parse(savedUsers) : defaultUsers)
        }

        // Departments from localStorage (ya alag se Firebase se la sakte hain)
        const savedDepts = localStorage.getItem('departments')
        setDepartments(savedDepts ? JSON.parse(savedDepts) : defaultDepartments)
        
        // Pending requests from localStorage
        setRequests(getPendingRequests())
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // ✅ Save functions - Firebase + LocalStorage sync
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

  // ✅ HANDLE SUBMIT - Firebase Integration
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
        const existingResult = await getAllUsers()
        if (existingResult.success && existingResult.data.some(u => u.email === formData.email)) {
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

        // ✅ DIRECT ADD TO FIREBASE
        const newUserData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || 'password123',
          department: formData.department,
          role: formData.role,
          status: 'active',
          createdBy: currentUser?.id,
          createdByName: currentUser?.name,
          lastLogin: null
        }

        const result = await createUser(newUserData)
        
        if (result.success) {
          // Refresh users list from Firebase
          const refreshResult = await getAllUsers()
          if (refreshResult.success) {
            saveUsers(refreshResult.data)
          }
          alert('User created successfully in Firebase!')
          closeModal()
        } else {
          alert('Error creating user: ' + result.error)
        }
        
      } else if (modalMode === 'edit' && selectedUser) {
        // Check if trying to change role
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

        // ✅ UPDATE IN FIREBASE
        const updates = {
          name: formData.name,
          phone: formData.phone,
          department: formData.department,
          role: formData.role,
          status: formData.status,
          updatedBy: currentUser?.id,
          updatedAt: new Date().toISOString()
        }

        // Only update password if provided
        if (formData.password) {
          updates.password = formData.password
        }

        // Check if user has Firebase ID (not local generated)
        if (selectedUser.id && !selectedUser.id.startsWith('user-')) {
          const result = await updateUser(selectedUser.id, updates)
          if (!result.success) {
            console.error('Firebase update failed:', result.error)
          }
        }

        // Update local state
        const updated = users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, ...updates, password: formData.password || u.password }
            : u
        )
        saveUsers(updated)
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

  // ✅ TOGGLE STATUS - Firebase Update
  const toggleStatus = async (user) => {
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

    try {
      // Update in Firebase if valid ID
      if (user.id && !user.id.startsWith('user-')) {
        await updateUser(user.id, { 
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      }

      // Update local state
      const updated = users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      )
      saveUsers(updated)
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to update status')
    }
  }

  // ✅ DELETE USER - Firebase Delete
  const deleteUser = async (user) => {
    if (!canDeleteUser(user)) {
      alert('You cannot delete this user!')
      return
    }

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      setLoading(true)
      try {
        // Delete from Firebase if valid ID
        if (user.id && !user.id.startsWith('user-')) {
          const result = await deleteUserFromFirebase(user.id)
          if (!result.success) {
            console.error('Firebase delete failed:', result.error)
          }
        }

        // Update local state
        const updated = users.filter(u => u.id !== user.id)
        saveUsers(updated)
        alert('User deleted successfully!')
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user')
      } finally {
        setLoading(false)
      }
    }
  }

  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Department', 'Role', 'Status', 'Created'].join(','),
      ...filteredUsers.map(u => [
        u.name, u.email, u.phone, u.department, u.role, u.status, 
        new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div>Loading users from Firebase...</div>
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
          <p>Manage system users, roles and permissions (Firebase Connected)</p>
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
                  {user.createdAt ? new Date(user.createdAt?.toDate ? user.createdAt.toDate() : user.createdAt).toLocaleDateString() : '-'}
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
                    <span>{selectedUser?.createdAt ? new Date(selectedUser.createdAt?.toDate ? selectedUser.createdAt.toDate() : selectedUser.createdAt).toLocaleString() : '-'}</span>
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