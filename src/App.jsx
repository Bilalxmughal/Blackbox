import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from "./context/AuthContext"
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData'
import ComplaintBoard from './pages/ComplaintBoard/ComplaintBoard'
import BackendSettings from './pages/BackendSettings/BackendSettings'
import UserManagement from './pages/UserManagement/UserManagement'

// Simple auth check
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const saved = localStorage.getItem('currentUser')
  const isLoggedIn = isAuthenticated || !!saved
  
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with Layout */}
          <Route path="/" element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }>
            <Route index element={<Dashboard />} />
            <Route path="ops-data" element={<BuscaroOpsData />} />
            <Route path="complaints" element={<ComplaintBoard />} />
            <Route path="backend" element={<BackendSettings />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
          
          {/* Redirect unknown to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App