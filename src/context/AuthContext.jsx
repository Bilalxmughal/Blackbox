import { createContext, useContext, useState, useEffect } from 'react'
import { defaultUsers, ROLES } from '../data/users'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for saved session
    const saved = localStorage.getItem('currentUser')
    if (saved) {
      try {
        const user = JSON.parse(saved)
        setCurrentUser(user)
        setIsAuthenticated(true)
      } catch (e) {
        console.error('Invalid saved user data')
        localStorage.removeItem('currentUser')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (email, password) => {
    console.log('Login attempt:', email, password) // Debug
    
    // Get users from localStorage or use defaults
    const savedUsers = localStorage.getItem('users')
    let users = []
    
    try {
      users = savedUsers ? JSON.parse(savedUsers) : defaultUsers
    } catch (e) {
      console.error('Error parsing users:', e)
      users = defaultUsers
    }
    
    console.log('Available users:', users.map(u => ({ email: u.email, role: u.role }))) // Debug
    
    // Find matching user
    const user = users.find(u => 
      u.email?.toLowerCase().trim() === email.toLowerCase().trim() && 
      u.password === password
    )

    if (user) {
      console.log('User found:', user.name, user.role) // Debug
      
      // Check if user is active
      if (user.status === 'inactive') {
        return { success: false, error: 'Your account is inactive. Contact Super Admin.' }
      }
      
      // Update last login
      const updatedUser = { ...user, lastLogin: new Date().toISOString() }
      
      // Update in users array
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u)
      localStorage.setItem('users', JSON.stringify(updatedUsers))
      
      // Set current user
      setCurrentUser(updatedUser)
      setIsAuthenticated(true)
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      
      return { success: true, user: updatedUser }
    }
    
    console.log('No user found with credentials') // Debug
    return { success: false, error: 'Invalid email or password' }
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('currentUser')
  }

  // Debug function to reset all data
  const resetData = () => {
    localStorage.clear()
    window.location.reload()
  }

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAuthenticated, 
      login, 
      logout,
      resetData,
      ROLES 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}