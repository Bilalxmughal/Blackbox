import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, UserCheck, UserX, Shield, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { ROLES, defaultUsers, defaultDepartments, getPendingRequests, savePendingRequest } from '../../data/users';
import styles from './UserManagement.module.css';

function UserManagement({ currentUser }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'roles', 'requests'
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form States
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    role: 'user',
    status: 'active'
  });
  const [newDept, setNewDept] = useState('');

  // Load data
  useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    const savedDepts = localStorage.getItem('departments');
    
    setUsers(savedUsers ? JSON.parse(savedUsers) : defaultUsers);
    setDepartments(savedDepts ? JSON.parse(savedDepts) : defaultDepartments);
    setPendingRequests(getPendingRequests());
  }, []);

  // Permission checks
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    const role = Object.values(ROLES).find(r => r.id === currentUser.role);
    if (!role) return false;
    if (role.permissions.includes('all')) return true;
    return role.permissions.includes(permission);
  };

  const canEditUser = (targetUser) => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'admin' && targetUser.role !== 'super_admin') return true;
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'admin' && targetUser.role !== 'super_admin' && targetUser.role !== 'admin') return true;
    return false;
  };

  // Save functions
  const saveUsers = (updated) => {
    setUsers(updated);
    localStorage.setItem('users', JSON.stringify(updated));
  };

  const saveRequests = (updated) => {
    setPendingRequests(updated);
    localStorage.setItem('pendingRequests', JSON.stringify(updated));
  };

  // User Actions
  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email || !userForm.phone) {
      alert('Please fill all required fields');
      return;
    }

    // OPS can only request
    if (currentUser?.role === 'ops' && !editingUser) {
      savePendingRequest({
        type: 'add_user',
        data: userForm,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name
      });
      alert('Request sent to Super Admin for approval!');
      resetForm();
      return;
    }

    if (editingUser) {
      // OPS requesting edit
      if (currentUser?.role === 'ops') {
        savePendingRequest({
          type: 'edit_user',
          userId: editingUser.id,
          data: userForm,
          requestedBy: currentUser.id,
          requestedByName: currentUser.name
        });
        alert('Edit request sent to Super Admin!');
        resetForm();
        return;
      }

      // Direct edit for Admin/Super Admin
      const updated = users.map(u => u.id === editingUser.id ? { ...u, ...userForm } : u);
      saveUsers(updated);
    } else {
      const newUser = {
        id: `user-${Date.now()}`,
        ...userForm,
        createdAt: new Date().toISOString()
      };
      saveUsers([...users, newUser]);
    }
    
    resetForm();
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      department: user.department,
      role: user.role,
      status: user.status || 'active'
    });
    setShowUserModal(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      department: '',
      role: 'user',
      status: 'active'
    });
    setShowUserModal(true);
  };

  const resetForm = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      department: '',
      role: 'user',
      status: 'active'
    });
  };

  const toggleUserStatus = (userId) => {
    const user = users.find(u => u.id === userId);
    
    // OPS needs permission
    if (currentUser?.role === 'ops') {
      savePendingRequest({
        type: 'toggle_status',
        userId: userId,
        currentStatus: user.status,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name
      });
      alert('Status change request sent!');
      return;
    }

    const updated = users.map(u => 
      u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    );
    saveUsers(updated);
  };

  const deleteUser = (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    // OPS cannot delete directly
    if (currentUser?.role === 'ops') {
      alert('You do not have permission to delete users. Request Super Admin.');
      return;
    }

    saveUsers(users.filter(u => u.id !== id));
  };

  // Request Handling (Super Admin only)
  const handleRequestAction = (requestId, action) => {
    const request = pendingRequests.find(r => r.id === requestId);
    
    if (action === 'approve') {
      switch(request.type) {
        case 'add_user':
          const newUser = {
            id: `user-${Date.now()}`,
            ...request.data,
            createdAt: new Date().toISOString()
          };
          saveUsers([...users, newUser]);
          break;
          
        case 'edit_user':
          const updatedUsers = users.map(u => 
            u.id === request.userId ? { ...u, ...request.data } : u
          );
          saveUsers(updatedUsers);
          break;
          
        case 'toggle_status':
          const user = users.find(u => u.id === request.userId);
          const toggled = users.map(u => 
            u.id === request.userId 
              ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } 
              : u
          );
          saveUsers(toggled);
          break;
      }
    }
    
    const updatedRequests = pendingRequests.filter(r => r.id !== requestId);
    saveRequests(updatedRequests);
  };

  // Department Management
  const handleAddDepartment = () => {
    if (!newDept) return;
    const dept = {
      id: `dept-${Date.now()}`,
      name: newDept,
      users: []
    };
    const updated = [...departments, dept];
    setDepartments(updated);
    localStorage.setItem('departments', JSON.stringify(updated));
    setNewDept('');
    setShowDeptModal(false);
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'super_admin': return styles.badgeRed;
      case 'admin': return styles.badgeOrange;
      case 'ops': return styles.badgeBlue;
      default: return styles.badgeGray;
    }
  };

  return (
    <div className={styles.container}>
      <h1>User Management</h1>
      
      {/* Navigation Tabs */}
      <div className={styles.navTabs}>
        <button 
          className={`${styles.navTab} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <UserCheck size={18} /> Users
        </button>
        <button 
          className={`${styles.navTab} ${activeTab === 'roles' ? styles.active : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={18} /> Roles & Permissions
        </button>
        {currentUser?.role === 'super_admin' && (
          <button 
            className={`${styles.navTab} ${activeTab === 'requests' ? styles.active : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Clock size={18} /> 
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className={styles.badge}>{pendingRequests.length}</span>
            )}
          </button>
        )}
      </div>

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <>
          {(hasPermission('add_user') || currentUser?.role === 'ops') && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Add User
            </button>
          )}

          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={user.status === 'inactive' ? styles.inactiveRow : ''}>
                    <td>
                      <div className={styles.userInfo}>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>{user.phone || '-'}</td>
                    <td><span className={styles.deptBadge}>{user.department}</span></td>
                    <td>
                      <span className={`${styles.roleBadge} ${getRoleBadgeColor(user.role)}`}>
                        {ROLES[user.role?.toUpperCase()]?.name || user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.status === 'active' ? styles.active : styles.inactive}`}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        {canEditUser(user) && (
                          <button onClick={() => handleEditClick(user)} className={styles.editBtn} title="Edit">
                            <Edit2 size={16} />
                          </button>
                        )}
                        {currentUser?.role === 'ops' && (
                          <button onClick={() => handleEditClick(user)} className={styles.requestBtn} title="Request Edit">
                            <Edit2 size={16} />
                          </button>
                        )}
                        
                        <button 
                          onClick={() => toggleUserStatus(user.id)} 
                          className={user.status === 'active' ? styles.deactivateBtn : styles.activateBtn}
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        
                        {canDeleteUser(user) && (
                          <button onClick={() => deleteUser(user.id)} className={styles.deleteBtn} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ROLES TAB */}
      {activeTab === 'roles' && (
        <div className={styles.rolesContainer}>
          {Object.values(ROLES).map(role => (
            <div key={role.id} className={styles.roleCard}>
              <div className={styles.roleHeader}>
                <Shield size={24} />
                <h3>{role.name}</h3>
              </div>
              <div className={styles.permissionsList}>
                <h4>Permissions:</h4>
                <ul>
                  {role.permissions.map((perm, idx) => (
                    <li key={idx}>
                      {perm === 'all' ? '✓ Full Access (All Permissions)' : `✓ ${perm.replace(/_/g, ' ').toUpperCase()}`}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.roleDescription}>
                {role.id === 'super_admin' && <p>Complete system control. Can approve/reject requests from other roles.</p>}
                {role.id === 'admin' && <p>Can manage users and departments but cannot modify Super Admin accounts.</p>}
                {role.id === 'ops' && <p>View-only access. All changes require Super Admin approval via requests.</p>}
                {role.id === 'user' && <p>Basic user access. Can only view own profile.</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PENDING REQUESTS TAB (Super Admin Only) */}
      {activeTab === 'requests' && currentUser?.role === 'super_admin' && (
        <div className={styles.requestsContainer}>
          {pendingRequests.length === 0 ? (
            <div className={styles.emptyState}>No pending requests</div>
          ) : (
            pendingRequests.map(request => (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.requestHeader}>
                  <span className={styles.requestType}>{request.type.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className={styles.requestTime}>
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <div className={styles.requestBody}>
                  <p><strong>Requested By:</strong> {request.requestedByName}</p>
                  
                  {request.type === 'add_user' && (
                    <div className={styles.requestDetails}>
                      <p><strong>New User:</strong> {request.data.name}</p>
                      <p><strong>Email:</strong> {request.data.email}</p>
                      <p><strong>Phone:</strong> {request.data.phone}</p>
                      <p><strong>Department:</strong> {request.data.department}</p>
                      <p><strong>Role:</strong> {request.data.role}</p>
                    </div>
                  )}
                  
                  {request.type === 'edit_user' && (
                    <div className={styles.requestDetails}>
                      <p><strong>Editing User ID:</strong> {request.userId}</p>
                      <p><strong>Changes:</strong></p>
                      <ul>
                        {Object.entries(request.data).map(([key, val]) => (
                          <li key={key}>{key}: {val}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {request.type === 'toggle_status' && (
                    <div className={styles.requestDetails}>
                      <p><strong>User ID:</strong> {request.userId}</p>
                      <p><strong>Current Status:</strong> {request.currentStatus}</p>
                      <p><strong>Requested Action:</strong> Toggle Status</p>
                    </div>
                  )}
                </div>
                
                <div className={styles.requestActions}>
                  <button 
                    onClick={() => handleRequestAction(request.id, 'approve')}
                    className={styles.approveBtn}
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button 
                    onClick={() => handleRequestAction(request.id, 'reject')}
                    className={styles.rejectBtn}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* USER MODAL */}
      {showUserModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input
                placeholder="Enter full name"
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Phone Number *</label>
                <input
                  placeholder="+92-300-1234567"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                />
              </div>
            </div>

            {!editingUser && (
              <div className={styles.formGroup}>
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                />
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Department</label>
                <select
                  value={userForm.department}
                  onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  disabled={currentUser?.role !== 'super_admin' && userForm.role === 'super_admin'}
                >
                  {Object.values(ROLES).map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {editingUser && (
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            <div className={styles.modalActions}>
              <button onClick={resetForm} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSaveUser} className={styles.saveBtn}>
                {currentUser?.role === 'ops' ? 'Send Request' : 'Save User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Add Department</h3>
            <input
              placeholder="Department Name"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeptModal(false)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleAddDepartment} className={styles.saveBtn}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;