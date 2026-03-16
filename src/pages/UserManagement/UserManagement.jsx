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

function UserManagement() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [requests, setRequests] = useState([])
  
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

  // Load data
  useEffect(() => {
    const savedUsers = localStorage.getItem('users')
    const savedDepts = localStorage.getItem('departments')
    
    setUsers(savedUsers ? JSON.parse(savedUsers) : defaultUsers)
    setDepartments(savedDepts ? JSON.parse(savedDepts) : defaultDepartments)
    setRequests(getPendingRequests())
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

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill all required fields')
      return
    }

    if (modalMode === 'add') {
      // Check if email exists
      if (users.some(u => u.email === formData.email)) {
        alert('Email already exists!')
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
        return
      }

      // Direct add for Admin/Super Admin
      const newUser = {
        id: `user-${Date.now()}`,
        ...formData,
        password: formData.password || 'password123',
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
      saveUsers([...users, newUser])
      
    } else if (modalMode === 'edit' && selectedUser) {
      // Check if trying to change role
      const isRoleChanged = formData.role !== selectedUser.role
      
      if (isRoleChanged && !canChangeRole) {
        alert('Only Super Admin can change roles!')
        return
      }

      if (isRoleChanged && currentUser?.role === 'super_admin') {
        // Role change needs approval even by Super Admin? No, direct change
        // But let's log it
        console.log('Role changed by Super Admin')
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
        return
      }

      const updated = users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...formData, password: formData.password || u.password }
          : u
      )
      saveUsers(updated)
    }
    
    closeModal()
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
  }

  const deleteUser = (user) => {
    if (!canDeleteUser(user)) {
      alert('You cannot delete this user!')
      return
    }

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      saveUsers(users.filter(u => u.id !== user.id))
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
                      disabled={modalMode === 'edit'}
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