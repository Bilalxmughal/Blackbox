import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { defaultUsers } from '../../data/users';
import styles from './Login.module.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check against default users or localStorage users
    const savedUsers = localStorage.getItem('users');
    const users = savedUsers ? JSON.parse(savedUsers) : defaultUsers;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      if (user.status === 'inactive') {
        setError('Your account is inactive. Contact Super Admin.');
        return;
      }
      onLogin(user);
      navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1>Buscaro</h1>
        <p>Sign in to your account</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign In</button>
        </form>
        
        <div className={styles.demoAccounts}>
          <p>Demo Accounts:</p>
          <small>super@buscaro.com / admin123</small>
        </div>
      </div>
    </div>
  );
}

export default Login;