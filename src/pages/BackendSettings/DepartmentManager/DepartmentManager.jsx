import { useState, useEffect } from 'react'
import { Plus, Trash2, Building2, Users, Search } from 'lucide-react'
import { defaultDepartments } from '../../../data/users'
import styles from './DepartmentManager.module.css'

function DepartmentManager() {
  const [departments, setDepartments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [newDeptName, setNewDeptName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('departments')
    setDepartments(saved ? JSON.parse(saved) : defaultDepartments)
  }, [])

  const saveDepartments = (updated) => {
    setDepartments(updated)
    localStorage.setItem('departments', JSON.stringify(updated))
  }

  const handleAdd = () => {
    if (!newDeptName.trim()) return
    
    const newDept = {
      id: `dept-${Date.now()}`,
      name: newDeptName.trim(),
      createdAt: new Date().toISOString()
    }
    
    saveDepartments([...departments, newDept])
    setNewDeptName('')
    setIsAdding(false)
  }

  const handleDelete = (id) => {
    const users = JSON.parse(localStorage.getItem('users')) || []
    const deptInUse = users.some(u => u.department === departments.find(d => d.id === id)?.name)
    
    if (deptInUse) {
      alert('Cannot delete! This department has assigned users.')
      return
    }
    
    if (confirm('Are you sure you want to delete this department?')) {
      saveDepartments(departments.filter(d => d.id !== id))
    }
  }

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get user count per department
  const getUserCount = (deptName) => {
    const users = JSON.parse(localStorage.getItem('users')) || []
    return users.filter(u => u.department === deptName).length
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Department Management</h2>
          <p>Create and manage company departments</p>
        </div>
        <button 
          className={styles.addBtn}
          onClick={() => setIsAdding(true)}
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {isAdding && (
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder="Enter department name..."
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <button onClick={handleAdd} className={styles.saveBtn}>Add</button>
          <button onClick={() => setIsAdding(false)} className={styles.cancelBtn}>Cancel</button>
        </div>
      )}

      <div className={styles.searchBox}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <Building2 size={24} color="#00d4ff" />
          <div>
            <span className={styles.statNumber}>{departments.length}</span>
            <span className={styles.statLabel}>Total Departments</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <Users size={24} color="#6bcf7f" />
          <div>
            <span className={styles.statNumber}>
              {departments.reduce((acc, d) => acc + getUserCount(d.name), 0)}
            </span>
            <span className={styles.statLabel}>Assigned Users</span>
          </div>
        </div>
      </div>

      <div className={styles.deptGrid}>
        {filteredDepts.map(dept => (
          <div key={dept.id} className={styles.deptCard}>
            <div className={styles.deptInfo}>
              <div className={styles.deptIcon}>
                <Building2 size={20} color="#00d4ff" />
              </div>
              <div>
                <h4>{dept.name}</h4>
                <span className={styles.userCount}>
                  {getUserCount(dept.name)} users assigned
                </span>
              </div>
            </div>
            <button 
              className={styles.deleteBtn}
              onClick={() => handleDelete(dept.id)}
              title="Delete Department"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {filteredDepts.length === 0 && (
        <div className={styles.emptyState}>
          <Building2 size={48} color="#ddd" />
          <p>No departments found</p>
        </div>
      )}
    </div>
  )
}

export default DepartmentManager