import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Tag, FolderTree } from 'lucide-react'
import { initialCategories } from '../../../data/initialCategories'
import styles from './CategoryManager.module.css'

function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [expandedCats, setExpandedCats] = useState({})
  const [editingCat, setEditingCat] = useState(null)
  const [editingSubCat, setEditingSubCat] = useState(null)
  
  // Form states
  const [newCatName, setNewCatName] = useState('')
  const [newCatCode, setNewCatCode] = useState('')
  const [newSubCatName, setNewSubCatName] = useState('')
  const [selectedCatForSub, setSelectedCatForSub] = useState('')

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

  // Category operations
  const addCategory = () => {
    if (!newCatName.trim() || !newCatCode.trim()) return
    
    const newCat = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      code: newCatCode.trim().toUpperCase(),
      subCategories: [],
      createdAt: new Date().toISOString()
    }
    
    saveCategories([...categories, newCat])
    setNewCatName('')
    setNewCatCode('')
  }

  const updateCategory = (id, updates) => {
    saveCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c))
    setEditingCat(null)
  }

  const deleteCategory = (id) => {
    if (confirm('Delete this category and all its sub-categories?')) {
      saveCategories(categories.filter(c => c.id !== id))
    }
  }

  // Sub-category operations
  const addSubCategory = () => {
    if (!newSubCatName.trim() || !selectedCatForSub) return
    
    const updated = categories.map(c => {
      if (c.id === selectedCatForSub) {
        return {
          ...c,
          subCategories: [
            ...c.subCategories,
            {
              id: `sub-${Date.now()}`,
              name: newSubCatName.trim(),
              createdAt: new Date().toISOString()
            }
          ]
        }
      }
      return c
    })
    
    saveCategories(updated)
    setNewSubCatName('')
    setSelectedCatForSub('')
  }

  const updateSubCategory = (catId, subId, newName) => {
    const updated = categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          subCategories: c.subCategories.map(s => 
            s.id === subId ? { ...s, name: newName } : s
          )
        }
      }
      return c
    })
    saveCategories(updated)
    setEditingSubCat(null)
  }

  const deleteSubCategory = (catId, subId) => {
    const updated = categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          subCategories: c.subCategories.filter(s => s.id !== subId)
        }
      }
      return c
    })
    saveCategories(updated)
  }

  const toggleExpand = (catId) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Category Management</h2>
          <p>Manage issue categories and sub-categories</p>
        </div>
      </div>

      {/* Add Category Section */}
      <div className={styles.addSection}>
        <h3><Tag size={18} /> Add New Category</h3>
        <div className={styles.inlineForm}>
          <input
            type="text"
            placeholder="Category Name (e.g., Vehicle Issue)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Code (e.g., VEH)"
            value={newCatCode}
            onChange={(e) => setNewCatCode(e.target.value.toUpperCase())}
            maxLength={5}
            style={{ width: '120px' }}
          />
          <button onClick={addCategory} className={styles.addBtn}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Add Sub-Category Section */}
      <div className={styles.addSection}>
        <h3><FolderTree size={18} /> Add Sub-Category</h3>
        <div className={styles.inlineForm}>
          <select
            value={selectedCatForSub}
            onChange={(e) => setSelectedCatForSub(e.target.value)}
          >
            <option value="">Select Parent Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Sub-category name"
            value={newSubCatName}
            onChange={(e) => setNewSubCatName(e.target.value)}
          />
          <button 
            onClick={addSubCategory} 
            className={styles.addBtn}
            disabled={!selectedCatForSub}
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className={styles.categoriesList}>
        <h3>All Categories ({categories.length})</h3>
        
        {categories.map(cat => (
          <div key={cat.id} className={styles.categoryCard}>
            {/* Category Header */}
            <div className={styles.catHeader}>
              <button 
                className={styles.expandBtn}
                onClick={() => toggleExpand(cat.id)}
              >
                {expandedCats[cat.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              {editingCat === cat.id ? (
                <div className={styles.editForm}>
                  <input
                    type="text"
                    defaultValue={cat.name}
                    onBlur={(e) => updateCategory(cat.id, { name: e.target.value })}
                    autoFocus
                  />
                  <input
                    type="text"
                    defaultValue={cat.code}
                    onBlur={(e) => updateCategory(cat.id, { code: e.target.value.toUpperCase() })}
                    maxLength={5}
                    style={{ width: '80px' }}
                  />
                </div>
              ) : (
                <div className={styles.catInfo}>
                  <span className={styles.codeBadge}>{cat.code}</span>
                  <h4>{cat.name}</h4>
                  <span className={styles.subCount}>
                    {cat.subCategories?.length || 0} sub-categories
                  </span>
                </div>
              )}
              
              <div className={styles.catActions}>
                <button 
                  onClick={() => setEditingCat(cat.id)}
                  className={styles.iconBtn}
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className={styles.iconBtnDanger}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Sub-categories List */}
            {expandedCats[cat.id] && (
              <div className={styles.subCategories}>
                {cat.subCategories?.length === 0 ? (
                  <p className={styles.noSub}>No sub-categories</p>
                ) : (
                  cat.subCategories.map(sub => (
                    <div key={sub.id} className={styles.subItem}>
                      {editingSubCat === `${cat.id}-${sub.id}` ? (
                        <input
                          type="text"
                          defaultValue={sub.name}
                          onBlur={(e) => updateSubCategory(cat.id, sub.id, e.target.value)}
                          autoFocus
                          className={styles.subEditInput}
                        />
                      ) : (
                        <span className={styles.subName}>{sub.name}</span>
                      )}
                      
                      <div className={styles.subActions}>
                        <button 
                          onClick={() => setEditingSubCat(`${cat.id}-${sub.id}`)}
                          className={styles.subBtn}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => deleteSubCategory(cat.id, sub.id)}
                          className={styles.subBtnDanger}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryManager