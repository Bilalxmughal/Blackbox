import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import UserManagement from './pages/UserManagement/UserManagement';
import BuscaroOpsData from './pages/BuscaroOpsData/BuscaroOpsData';
import Layout from './components/Layout/Layout';

// Simple auth check
const getCurrentUser = () => {
  const saved = localStorage.getItem('currentUser');
  return saved ? JSON.parse(saved) : null;
};

function App() {
  const [user, setUser] = useState(getCurrentUser());

  const handleLogin = (userData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/users" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}>
              <UserManagement currentUser={user} />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/ops-data" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}>
              <BuscaroOpsData isAdmin={user?.role === 'admin' || user?.role === 'super_admin'} />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;