import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bus, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react'
import styles from './Login.module.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        console.log('Login successful, navigating to dashboard...')
        navigate('/', { replace: true })
        
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            console.log('Navigate failed, using window.location')
            window.location.href = '/'
          }
        }, 500)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Login failed. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      {/* Background Pattern */}
      <div className={styles.bgPattern}></div>
      
      {/* Left Side - Branding */}
      <div className={styles.brandSection}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Bus size={32} />
            </div>
            <div className={styles.logoText}>
              <h1>BusCaro</h1>
              <span>BlackBox</span>
            </div>
          </div>
          <p className={styles.tagline}>
            Streamline your transportation operations with our comprehensive CRM solution
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureDot}></div>
              <span>Complaint Management</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureDot}></div>
              <span>Operations Dashboard</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureDot}></div>
              <span>Real-time Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className={styles.formSection}>
        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@buscaro.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.rememberMe}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className={styles.forgotPassword}>Forgot password?</a>
            </div>

            <button 
              type="submit" 
              className={styles.loginBtn} 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner}></span>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

 
        </div>

        <p className={styles.copyright}>
          © 2026 BusCaro BlackBox. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default Login