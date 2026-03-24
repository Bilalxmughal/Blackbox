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

  // Initialize auth state on app mount
  useEffect(() => {
    try {
      let localUsers = [];
      const savedUsers = localStorage.getItem('users');
      
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) localUsers = parsed;
        } catch (e) {
          console.error('Error parsing users:', e);
        }
      }

      // Ensure default users exist — restore any that are missing
      const hasSuperAdmin = localUsers.some(u => u.email === 'super@buscaro.com');
      const hasAdmin = localUsers.some(u => u.email === 'admin@buscaro.com');
      const hasOps = localUsers.some(u => u.email === 'ops@buscaro.com');
      
      if (!hasSuperAdmin || !hasAdmin || !hasOps) {
        const existingEmails = new Set(localUsers.map(u => u.email.toLowerCase()));
        const usersToAdd = defaultUsers.filter(u => !existingEmails.has(u.email.toLowerCase()));
        localUsers = [...localUsers, ...usersToAdd];
        localStorage.setItem('users', JSON.stringify(localUsers));
      }

      // Restore session from localStorage if user still exists
      const savedCurrentUser = localStorage.getItem('currentUser');
      if (savedCurrentUser) {
        try {
          const user = JSON.parse(savedCurrentUser);
          const userStillExists = localUsers.some(u => u.email === user.email);
          if (userStillExists) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('currentUser');
          }
        } catch (e) {
          localStorage.removeItem('currentUser');
        }
      }
      
      setIsLoading(false);
      
      // Background Firebase sync after UI is ready
      setTimeout(() => {
        syncWithFirebase(localUsers);
      }, 100);
      
    } catch (e) {
      console.error('Initialization error:', e);
      setIsLoading(false);
    }
  }, []);

  // ✅ Background sync — adds new Firebase users and stores firebaseId on existing users
  // Never overwrites local passwords
  const syncWithFirebase = async (localUsers) => {
    try {
      const firebaseResult = await getAllUsers();
      if (!firebaseResult.success) return;

      const firebaseUsers = firebaseResult.data;  // each has id = Firebase doc ID
      let updated = [...localUsers];
      let changed = false;

      firebaseUsers.forEach(fbUser => {
        const localIndex = updated.findIndex(
          u => u.email?.toLowerCase() === fbUser.email?.toLowerCase()
        );

        if (localIndex !== -1) {
          // User exists — store Firebase doc ID if not already present
          if (!updated[localIndex].firebaseId) {
            updated[localIndex] = { ...updated[localIndex], firebaseId: fbUser.id };
            changed = true;
          }
        } else {
          // New user from Firebase not in localStorage
          updated.push({ ...fbUser, firebaseId: fbUser.id });
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem('users', JSON.stringify(updated));
        console.log('Firebase sync complete — firebaseIds stored');
      }

    } catch (err) {
      console.log('Firebase offline, using local data');
    }
  };

  // Authenticate user against localStorage
  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
      let users = [];
      const savedUsers = localStorage.getItem('users');
      
      if (savedUsers) {
        try { users = JSON.parse(savedUsers); }
        catch (e) { users = defaultUsers; }
      }
      
      if (!Array.isArray(users) || users.length === 0) {
        users = defaultUsers;
        localStorage.setItem('users', JSON.stringify(defaultUsers));
      }

      const user = users.find(u => {
        return u.email?.toLowerCase().trim() === cleanEmail &&
               u.password?.trim() === cleanPassword;
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

      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Background: save login session to Firebase
      setTimeout(() => { saveLoginSession(user).catch(() => {}); }, 0);
      
      return { success: true, user: updatedUser };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  // Create user locally first, then sync to Firebase
  const createUserInstant = async (userData) => {
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
    
    // Background: sync to Firebase and store firebaseId
    setTimeout(async () => {
      try {
        const result = await createUser({ ...newUser, password: newUser.password || '123456' });
        if (result.success) {
          const finalUsers = updated.map(u => 
            u.id === newUser.id ? { ...u, firebaseId: result.id } : u
          );
          localStorage.setItem('users', JSON.stringify(finalUsers));
          console.log('User synced to Firebase:', result.id);
        }
      } catch (err) {
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      currentUser, isAuthenticated, isLoading,
      login, logout, createUserInstant,
      resetAllData, forceLogin, ROLES 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};