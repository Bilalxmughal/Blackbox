import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAllUsers, 
  saveLoginSession,
  createUser
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
    
    // ✅ INSTANT LOAD - No async, no waiting
    try {
      let localUsers = [];
      const savedUsers = localStorage.getItem('users');
      
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localUsers = parsed;
          }
        } catch (e) {
          console.error('Error parsing users:', e);
        }
      }

      // ✅ Ensure default users exist (Super Admin, Admin, Ops)
      const hasSuperAdmin = localUsers.some(u => u.email === 'super@buscaro.com');
      const hasAdmin = localUsers.some(u => u.email === 'admin@buscaro.com');
      const hasOps = localUsers.some(u => u.email === 'ops@buscaro.com');
      
      if (!hasSuperAdmin || !hasAdmin || !hasOps) {
        console.log('⚠️ Default users missing, restoring...');
        const existingEmails = new Set(localUsers.map(u => u.email.toLowerCase()));
        const usersToAdd = defaultUsers.filter(u => !existingEmails.has(u.email.toLowerCase()));
        
        localUsers = [...localUsers, ...usersToAdd];
        localStorage.setItem('users', JSON.stringify(localUsers));
      }

      // ✅ Restore session instantly
      const savedCurrentUser = localStorage.getItem('currentUser');
      if (savedCurrentUser) {
        try {
          const user = JSON.parse(savedCurrentUser);
          const userStillExists = localUsers.some(u => u.email === user.email);
          if (userStillExists) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            console.log('✅ Session restored:', user.email);
          } else {
            localStorage.removeItem('currentUser');
          }
        } catch (e) {
          localStorage.removeItem('currentUser');
        }
      }
      
      // ✅ DONE - No waiting for Firebase
      setIsLoading(false);
      
      // ✅ Background mein Firebase sync (silent, no blocking)
      setTimeout(() => {
        syncWithFirebase(localUsers);
      }, 100);
      
    } catch (e) {
      console.error('Initialization error:', e);
      setIsLoading(false);
    }
  }, []);

  // ✅ BACKGROUND SYNC - Silent, no UI impact
  const syncWithFirebase = async (localUsers) => {
    try {
      const firebaseResult = await getAllUsers();
      if (firebaseResult.success) {
        console.log('🔥 Firebase sync:', firebaseResult.data.length, 'users');
        
        // Merge new users from Firebase
        const localEmails = new Set(localUsers.map(u => u.email.toLowerCase()));
        const newUsers = firebaseResult.data.filter(u => !localEmails.has(u.email.toLowerCase()));
        
        if (newUsers.length > 0) {
          const merged = [...localUsers, ...newUsers];
          localStorage.setItem('users', JSON.stringify(merged));
          console.log('✅ Merged', newUsers.length, 'new users from Firebase');
        }
      }
    } catch (err) {
      // Silent fail - no console spam
      console.log('Firebase offline, using local data');
    }
  };

  const login = async (email, password) => {
    console.log('=== LOGIN ATTEMPT ===');
    
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
      // ✅ INSTANT localStorage read
      let users = [];
      const savedUsers = localStorage.getItem('users');
      
      if (savedUsers) {
        try {
          users = JSON.parse(savedUsers);
        } catch (e) {
          users = defaultUsers;
        }
      }
      
      if (!Array.isArray(users) || users.length === 0) {
        users = defaultUsers;
        localStorage.setItem('users', JSON.stringify(defaultUsers));
      }

      // ✅ Find user instantly
      const user = users.find(u => {
        const userEmail = u.email?.toLowerCase().trim();
        const userPassword = u.password?.trim();
        return userEmail === cleanEmail && userPassword === cleanPassword;
      });

      if (!user) {
        const emailExists = users.some(u => u.email?.toLowerCase().trim() === cleanEmail);
        return { 
          success: false, 
          error: emailExists ? 'Incorrect password' : 'Email not registered' 
        };
      }

      if (user.status === 'inactive') {
        return { success: false, error: 'Account inactive' };
      }

      // ✅ INSTANT SUCCESS - No waiting
      const updatedUser = { 
        ...user, 
        lastLogin: new Date().toISOString() 
      };
      
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      console.log('✅ LOGIN SUCCESS:', user.email);
      
      // ✅ BACKGROUND: Save login session to Firebase (silent)
      setTimeout(() => {
        saveLoginSession(user).catch(() => {});
      }, 0);
      
      return { success: true, user: updatedUser };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  // ✅ CREATE USER - Instant local, background Firebase
  const createUserInstant = async (userData) => {
    // ✅ INSTANT: LocalStorage mein add karo
    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    const savedUsers = localStorage.getItem('users');
    const users = savedUsers ? JSON.parse(savedUsers) : [];
    const updated = [...users, newUser];
    localStorage.setItem('users', JSON.stringify(updated));
    
    console.log('✅ User created instantly:', newUser.email);
    
    // ✅ BACKGROUND: Firebase mein bhi save karo (silent)
    setTimeout(async () => {
      try {
        const result = await createUser(newUser);
        if (result.success) {
          // Update local ID with Firebase ID
          const finalUsers = updated.map(u => 
            u.id === newUser.id ? { ...u, id: result.id } : u
          );
          localStorage.setItem('users', JSON.stringify(finalUsers));
          console.log('🔥 User synced to Firebase:', result.id);
        }
      } catch (err) {
        // Silent fail - will sync later
        console.log('Firebase sync pending for:', newUser.email);
      }
    }, 0);
    
    return { success: true, user: newUser };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const resetAllData = () => {
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

  // ✅ MINIMAL LOADING SCREEN - 500ms max
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAuthenticated, 
      isLoading,
      login, 
      logout,
      createUserInstant,
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
