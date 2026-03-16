import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from "./context/AuthContext"
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData'
import ComplaintBoard from './pages/ComplaintBoard/ComplaintBoard'
import BackendSettings from './pages/BackendSettings/BackendSettings'
import UserManagement from './pages/UserManagement/UserManagement'

// PrivateRoute component - check auth and render outlet
function PrivateRoute() {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <Outlet />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
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