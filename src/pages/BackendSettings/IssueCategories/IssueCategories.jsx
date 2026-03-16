import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { initialCategories } from '../../../data/initialCategories'
import styles from './IssueCategories.module.css'

function IssueCategories() {
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState({ name: '', code: '' })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('categories')
    if (saved) {
      setCategories(JSON.parse(saved))
    } else {
      setCategories(initialCategories)
      localStorage.setItem('categories', JSON.stringify(initialCategories))
    }
  }, [])

  const saveCategories = (updated) => {
    setCategories(updated)
    localStorage.setItem('categories', JSON.stringify(updated))
  }

  const handleAdd = () => {
    if (!newCategory.name || !newCategory.code) return
    
    const category = {
      id: `cat-${Date.now()}`,
      name: newCategory.name,
      code: newCategory.code.toUpperCase(),
      subCategories: []
    }
    
    saveCategories([...categories, category])
    setNewCategory({ name: '', code: '' })
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      saveCategories(categories.filter(c => c.id !== id))
    }
  }

  const handleUpdate = (id, updates) => {
    saveCategories(categories.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ))
    setEditingId(null)
  }

  return (
    <div className={styles.container}>
      <h2>Manage Issue Categories</h2>
      
      <div className={styles.addForm}>
        <input
          type="text"
          placeholder="Category Name (e.g., Vehicle)"
          value={newCategory.name}
          onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
        />
        <input
          type="text"
          placeholder="Code (e.g., VEH)"
          value={newCategory.code}
          onChange={(e) => setNewCategory({...newCategory, code: e.target.value})}
          maxLength={3}
        />
        <button onClick={handleAdd} className={styles.addBtn}>
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className={styles.categoriesList}>
        {categories.map(cat => (
          <div key={cat.id} className={styles.categoryCard}>
            {editingId === cat.id ? (
              <div className={styles.editForm}>
                <input
                  type="text"
                  defaultValue={cat.name}
                  onBlur={(e) => handleUpdate(cat.id, { name: e.target.value })}
                  autoFocus
                />
                <input
                  type="text"
                  defaultValue={cat.code}
                  maxLength={3}
                  onBlur={(e) => handleUpdate(cat.id, { code: e.target.value.toUpperCase() })}
                />
              </div>
            ) : (
              <div className={styles.categoryInfo}>
                <h3>{cat.name}</h3>
                <span className={styles.code}>{cat.code}</span>
                <span className={styles.count}>
                  {cat.subCategories?.length || 0} sub-categories
                </span>
              </div>
            )}
            
            <div className={styles.actions}>
              <button 
                onClick={() => setEditingId(cat.id)}
                className={styles.editBtn}
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(cat.id)}
                className={styles.deleteBtn}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IssueCategories