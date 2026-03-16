import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from "./context/AuthContext"
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData'
import ComplaintBoard from './pages/ComplaintBoard/ComplaintBoard'
import BackendSettings from './pages/BackendSettings/BackendSettings'
import UserManagement from './pages/UserManagement/UserManagement'

// Loading component
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#1a1a2e'
    }}>
      <div style={{ color: '#00d4ff', fontSize: '20px' }}>Loading...</div>
    </div>
  )
}

// PrivateRoute with loading check
function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <Outlet />
}

// Public route - redirect if already logged in
function PublicRoute() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <Outlet />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="ops-data" element={<BuscaroOpsData />} />
              <Route path="complaints" element={<ComplaintBoard />} />
              <Route path="backend" element={<BackendSettings />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App