import { createContext, useContext, useState, useEffect } from 'react'
import { defaultUsers } from '../data/users'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('currentUser')
    if (saved) {
      setCurrentUser(JSON.parse(saved))
      setIsAuthenticated(true)
    }
  }, [])

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users')) || defaultUsers
    const user = users.find(u => u.email === email && u.password === password)
    
    if (user) {
      setCurrentUser(user)
      setIsAuthenticated(true)
      localStorage.setItem('currentUser', JSON.stringify(user))
      return { success: true }
    }
    return { success: false, error: 'Invalid credentials' }
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)