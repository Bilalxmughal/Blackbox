import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { defaultUsers, defaultDepartments } from '../../data/users'
import styles from './UserManagement.module.css'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddDept, setShowAddDept] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', department: '' })
  const [newDept, setNewDept] = useState('')

  useEffect(() => {
    const savedUsers = localStorage.getItem('users')
    const savedDepts = localStorage.getItem('departments')
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    } else {
      setUsers(defaultUsers)
      localStorage.setItem('users', JSON.stringify(defaultUsers))
    }
    
    if (savedDepts) {
      setDepartments(JSON.parse(savedDepts))
    } else {
      setDepartments(defaultDepartments)
      localStorage.setItem('departments', JSON.stringify(defaultDepartments))
    }
  }, [])

  const saveUsers = (updated) => {
    setUsers(updated)
    localStorage.setItem('users', JSON.stringify(updated))
  }

  const saveDepartments = (updated) => {
    setDepartments(updated)
    localStorage.setItem('departments', JSON.stringify(updated))
  }

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) return
    
    const user = {
      id: `user-${Date.now()}`,
      ...newUser,
      role: 'user'
    }
    
    saveUsers([...users, user])
    
    // Update department
    if (newUser.department) {
      const updatedDepts = departments.map(d => {
        if (d.name === newUser.department) {
          return { ...d, users: [...d.users, user.id] }
        }
        return d
      })
      saveDepartments(updatedDepts)
    }
    
    setNewUser({ name: '', email: '', password: '', department: '' })
    setShowAddUser(false)
  }

  const handleAddDepartment = () => {
    if (!newDept) return
    
    const dept = {
      id: `dept-${Date.now()}`,
      name: newDept,
      users: []
    }
    
    saveDepartments([...departments, dept])
    setNewDept('')
    setShowAddDept(false)
  }

  const deleteUser = (id) => {
    if (confirm('Delete this user?')) {
      saveUsers(users.filter(u => u.id !== id))
    }
  }

  return (
    <div className={styles.container}>
      <h1>User Management</h1>
      
      <div className={styles.tabs}>
        <button onClick={() => setShowAddUser(!showAddUser)} className={styles.addBtn}>
          <Plus size={18} /> Add User
        </button>
        <button onClick={() => setShowAddDept(!showAddDept)} className={styles.addBtn}>
          <Plus size={18} /> Add Department
        </button>
      </div>

      {showAddUser && (
        <div className={styles.formBox}>
          <h3>Add New User</h3>
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
          />
          <input
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
          />
          <input
            placeholder="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
          />
          <select
            value={newUser.department}
            onChange={(e) => setNewUser({...newUser, department: e.target.value})}
          >
            <option value="">Select Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <button onClick={handleAddUser}>Save User</button>
        </div>
      )}

      {showAddDept && (
        <div className={styles.formBox}>
          <h3>Add New Department</h3>
          <input
            placeholder="Department Name"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
          />
          <button onClick={handleAddDepartment}>Save Department</button>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.section}>
          <h2>Users ({users.length})</h2>
          {users.map(user => (
            <div key={user.id} className={styles.card}>
              <div>
                <strong>{user.name}</strong>
                <p>{user.email}</p>
                <span className={styles.dept}>{user.department}</span>
              </div>
              <button onClick={() => deleteUser(user.id)} className={styles.delete}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.section}>
          <h2>Departments ({departments.length})</h2>
          {departments.map(dept => (
            <div key={dept.id} className={styles.card}>
              <div>
                <strong>{dept.name}</strong>
                <p>{dept.users.length} users assigned</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserManagement