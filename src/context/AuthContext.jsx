import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAllUsers, 
  saveLoginSession
} from '../lib/firebase';
import { defaultUsers, ROLES } from '../data/users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    console.log('=== AUTH CONTEXT MOUNTED ===');
    
    const initializeData = async () => {
      try {
        // Pehle localStorage check karo (fast)
        const savedUsers = localStorage.getItem('users');
        const savedCurrentUser = localStorage.getItem('currentUser');
        
        if (savedUsers) {
          try {
            const parsed = JSON.parse(savedUsers);
            if (Array.isArray(parsed)) {
              console.log('Loaded users from localStorage:', parsed.length);
            }
          } catch (e) {
            console.error('Error parsing localStorage users:', e);
          }
        } else {
          // Agar localStorage empty hai to default set karo
          localStorage.setItem('users', JSON.stringify(defaultUsers));
        }

        // Check for existing session
        if (savedCurrentUser) {
          try {
            const user = JSON.parse(savedCurrentUser);
            setCurrentUser(user);
            setIsAuthenticated(true);
            console.log('Restored session:', user.email);
          } catch (e) {
            localStorage.removeItem('currentUser');
          }
        }
        
        // Firebase se background mein sync karo (blocking nahi)
        try {
          const firebaseUsers = await getAllUsers();
          if (firebaseUsers.success && firebaseUsers.data.length > 0) {
            // Merge Firebase data with localStorage
            localStorage.setItem('users', JSON.stringify(firebaseUsers.data));
            console.log('Synced with Firebase:', firebaseUsers.data.length);
          }
        } catch (firebaseError) {
          console.log('Firebase sync failed (non-critical):', firebaseError.message);
        }
        
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const login = async (email, password) => {
    console.log('=== LOGIN ATTEMPT ===');
    
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
      // Pehle localStorage se check karo (fast)
      let users = [];
      const savedUsers = localStorage.getItem('users');
      
      if (savedUsers) {
        try {
          users = JSON.parse(savedUsers);
        } catch (e) {
          users = defaultUsers;
        }
      } else {
        users = defaultUsers;
        localStorage.setItem('users', JSON.stringify(defaultUsers));
      }

      console.log('Total users:', users.length);

      // Find user
      const user = users.find(u => {
        const userEmail = u.email?.toLowerCase().trim();
        const userPassword = u.password?.trim();
        return userEmail === cleanEmail && userPassword === cleanPassword;
      });

      console.log('Found user:', user ? user.name : 'NO MATCH');

      if (!user) {
        const emailExists = users.some(u => 
          u.email?.toLowerCase().trim() === cleanEmail
        );
        
        if (emailExists) {
          return { success: false, error: 'Incorrect password' };
        }
        return { success: false, error: 'Email not registered' };
      }

      if (user.status === 'inactive') {
        return { success: false, error: 'Account inactive. Contact Super Admin.' };
      }

      // ✅ LOGIN SESSION FIREBASE MEIN SAVE KARO (background mein)
      saveLoginSession(user).catch(err => 
        console.log('Login session save failed (non-critical):', err)
      );

      // Success
      const updatedUser = { 
        ...user, 
        lastLogin: new Date().toISOString() 
      };
      
      // Set session
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      console.log('=== LOGIN SUCCESS ===');
      return { success: true, user: updatedUser };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    // Page reload mat karo, bas state clear karo
  };

  const resetAllData = () => {
    console.log('=== RESETTING ALL DATA ===');
    localStorage.clear();
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    window.location.reload();
  };

  const forceLogin = (email) => {
    const savedUsers = localStorage.getItem('users');
    const users = savedUsers ? JSON.parse(savedUsers) : defaultUsers;
    const user = users.find(u => u.email?.toLowerCase().trim() === email.toLowerCase().trim());
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'sans-serif',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>Loading CRM...</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Please wait...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAuthenticated, 
      login, 
      logout,
      resetAllData,
      forceLogin,
      ROLES 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};