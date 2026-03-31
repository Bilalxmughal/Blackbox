import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData'
import ComplaintBoard from './pages/ComplaintBoard/ComplaintBoard'
import ComplaintDetail from './pages/ComplaintDetail/ComplaintDetail'
import BackendSettings from './pages/BackendSettings/BackendSettings'
import UserManagement from './pages/UserManagement/UserManagement'
import ClientForm from './pages/Clients/ClientForm'
import Clients from './pages/Clients/Clients'
import ClientView from './pages/Clients/ClientView'
import Vendors from './pages/Vendors/Vendors'
import VendorForm from './pages/Vendors/VendorForm'
import VendorView from './pages/Vendors/VendorView'

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
            <Route path="complaints/:id" element={<ComplaintDetail />} />
            <Route path="backend" element={<BackendSettings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<ClientForm />} />
            <Route path="clients/edit/:id" element={<ClientForm />} />
            <Route path="clients/:id" element={<ClientView />} /> 
            <Route path="vendors" element={<Vendors />} />
            <Route path="vendors/new" element={<VendorForm />} />
            <Route path="vendors/edit/:id" element={<VendorForm />} />
            <Route path="vendors/:id" element={<VendorView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App