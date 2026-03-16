import { useState, useEffect } from 'react'
import { Plus, Trash2, UserPlus, UserMinus } from 'lucide-react'
import styles from './SubCategories.module.css'

function SubCategories() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [newSubCategory, setNewSubCategory] = useState('')
  const [newUser, setNewUser] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('categories')
    if (saved) {
      setCategories(JSON.parse(saved))
    }
  }, [])

  const saveCategories = (updated) => {
    setCategories(updated)
    localStorage.setItem('categories', JSON.stringify(updated))
  }

  const handleAddSubCategory = () => {
    if (!selectedCategory || !newSubCategory) return

    const updated = categories.map(cat => {
      if (cat.id === selectedCategory) {
        return {
          ...cat,
          subCategories: [
            ...(cat.subCategories || []),
            {
              id: `sub-${Date.now()}`,
              name: newSubCategory,
              assignedUsers: []
            }
          ]
        }
      }
      return cat
    })

    saveCategories(updated)
    setNewSubCategory('')
  }

  const handleDeleteSubCategory = (catId, subId) => {
    const updated = categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          subCategories: cat.subCategories.filter(sub => sub.id !== subId)
        }
      }
      return cat
    })
    saveCategories(updated)
  }

  const handleAddUser = (catId, subId) => {
    if (!newUser) return

    const updated = categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          subCategories: cat.subCategories.map(sub => {
            if (sub.id === subId) {
              return {
                ...sub,
                assignedUsers: [...(sub.assignedUsers || []), newUser]
              }
            }
            return sub
          })
        }
      }
      return cat
    })

    saveCategories(updated)
    setNewUser('')
  }

  const handleRemoveUser = (catId, subId, userIndex) => {
    const updated = categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          subCategories: cat.subCategories.map(sub => {
            if (sub.id === subId) {
              const users = [...sub.assignedUsers]
              users.splice(userIndex, 1)
              return { ...sub, assignedUsers: users }
            }
            return sub
          })
        }
      }
      return cat
    })
    saveCategories(updated)
  }

  const selectedCat = categories.find(c => c.id === selectedCategory)

  return (
    <div className={styles.container}>
      <h2>Manage Sub-Categories & Users</h2>

      <div className={styles.categorySelect}>
        <label>Select Category:</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">-- Select --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <>
          <div className={styles.addSection}>
            <input
              type="text"
              placeholder="New Sub-Category Name"
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
            />
            <button onClick={handleAddSubCategory} className={styles.addBtn}>
              <Plus size={18} />
              Add Sub-Category
            </button>
          </div>

          <div className={styles.subCategoriesList}>
            {selectedCat?.subCategories?.map(sub => (
              <div key={sub.id} className={styles.subCategoryCard}>
                <div className={styles.subHeader}>
                  <h4>{sub.name}</h4>
                  <button 
                    onClick={() => handleDeleteSubCategory(selectedCategory, sub.id)}
                    className={styles.deleteBtn}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className={styles.usersSection}>
                  <label>Assigned Users:</label>
                  <div className={styles.usersList}>
                    {sub.assignedUsers?.map((user, idx) => (
                      <span key={idx} className={styles.userTag}>
                        {user}
                        <button 
                          onClick={() => handleRemoveUser(selectedCategory, sub.id, idx)}
                          className={styles.removeUser}
                        >
                          <UserMinus size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className={styles.addUser}>
                    <input
                      type="text"
                      placeholder="Add user name"
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                    />
                    <button 
                      onClick={() => handleAddUser(selectedCategory, sub.id)}
                      className={styles.addUserBtn}
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default SubCategories