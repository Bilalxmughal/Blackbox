import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData'
import ComplaintBoard from './pages/ComplaintBoard/ComplaintBoard'
import BackendSettings from './pages/BackendSettings/BackendSettings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ops-data" element={<BuscaroOpsData />} />
          <Route path="complaints" element={<ComplaintBoard />} />
          <Route path="backend" element={<BackendSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App