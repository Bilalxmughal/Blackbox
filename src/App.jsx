import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import UserManagement from './pages/UserManagement/UserManagement'
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData'
import Layout from './components/Layout/Layout'

// Get current user from localStorage
const getCurrentUser = () => {
  const saved = localStorage.getItem('currentUser')
  return saved ? JSON.parse(saved) : null
}

// Protected Route wrapper
const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />
  return children || <Outlet />
}

function App() {
  const [user, setUser] = useState(getCurrentUser())

  const handleLogin = (userData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          } 
        />
        
        {/* Protected Routes with Layout */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route 
            path="/" 
            element={
              <Layout user={user} onLogout={handleLogout}>
                <Dashboard />
              </Layout>
            } 
          />
          <Route 
            path="/users" 
            element={
              <Layout user={user} onLogout={handleLogout}>
                <UserManagement currentUser={user} />
              </Layout>
            } 
          />
          <Route 
            path="/ops-data" 
            element={
              <Layout user={user} onLogout={handleLogout}>
                <BuscaroOpsData isAdmin={user?.role === 'admin' || user?.role === 'super_admin'} />
              </Layout>
            } 
          />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App