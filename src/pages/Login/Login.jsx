import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Login.module.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = login(email, password)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1>BusCaro - BlackBox</h1>
        <h2>CRM Login</h2>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@buscaro.com"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>
          
          <button type="submit" className={styles.loginBtn}>
            Login
          </button>
        </form>
        

      </div>
    </div>
  )
}

// Inside the login form or below it, add this emergency section:

<div style={{ marginTop: '20px', padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
  <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
    ⚠️ Login issues? Click below to reset:
  </p>
  
  <button 
    type="button"
    onClick={() => {
      // Force reset
      localStorage.removeItem('users')
      localStorage.setItem('users', JSON.stringify([
        {
          id: 'user-1',
          name: 'Super Admin',
          email: 'super@buscaro.com',
          phone: '+92-300-1234567',
          password: 'admin123',
          department: 'Management',
          role: 'super_admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        {
          id: 'user-2',
          name: 'Admin User',
          email: 'admin@buscaro.com',
          phone: '+92-300-7654321',
          password: 'admin123',
          department: 'HR',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: 'user-3',
          name: 'Ops User',
          email: 'ops@buscaro.com',
          phone: '+92-300-1112223',
          password: 'admin123',
          department: 'Operations',
          role: 'ops',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ]))
      alert('✅ Data reset! Now try logging in with:\nsuper@buscaro.com / admin123')
      window.location.reload()
    }}
    style={{
      padding: '10px 20px',
      background: '#ff6b6b',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      cursor: 'pointer'
    }}
  >
    🔄 Reset to Default Users
  </button>
</div>

export default Login