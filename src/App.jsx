import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from "./context/AuthContext"
import Layout from './components/Layout/Layout'
import Layout from './components/LeftPanel'
import Layout from './context'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData'
import ComplaintBoard from './pages/ComplaintBoard/ComplaintBoard'
import BackendSettings from './pages/BackendSettings/BackendSettings'
import UserManagement from './pages/UserManagement/UserManagement'


function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="ops-data" element={<BuscaroOpsData />} />
            <Route path="complaints" element={<ComplaintBoard />} />
            <Route path="backend" element={<BackendSettings />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App