import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData'
import ComplaintBoard from './pages/ComplaintBoard/ComplaintBoard'

// TEMPORARY - No auth check
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ops-data" element={<BuscaroOpsData />} />
          <Route path="complaints" element={<ComplaintBoard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App