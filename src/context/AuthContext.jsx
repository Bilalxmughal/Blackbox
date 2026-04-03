import { createContext, useContext, useState, useEffect } from 'react';
import { getAllUsers, saveLoginSession, createUser } from '../lib/firebase';
import { defaultUsers, ROLES } from '../data/users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
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

      // Ensure default users exist
      const existingEmails = new Set(localUsers.map(u => u.email.toLowerCase()));
      const usersToAdd = defaultUsers.filter(u => !existingEmails.has(u.email.toLowerCase()));
      if (usersToAdd.length > 0) {
        localUsers = [...localUsers, ...usersToAdd];
        localStorage.setItem('users', JSON.stringify(localUsers));
      }

      // Restore session safely
      const savedCurrentUser = localStorage.getItem('currentUser');
      if (savedCurrentUser) {
        try {
          const user = JSON.parse(savedCurrentUser);
          const userExists = localUsers.some(u => u.email === user.email);
          if (userExists) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('currentUser');
          }
        } catch {
          localStorage.removeItem('currentUser');
        }
      }

      setIsLoading(false);

      // Background Firebase sync
      setTimeout(() => syncWithFirebase(localUsers), 100);
    } catch (e) {
      console.error('Initialization error:', e);
      setIsLoading(false);
    }
  }, []);

  // Background Firebase sync
  const syncWithFirebase = async (localUsers) => {
    try {
      const firebaseResult = await getAllUsers();
      if (!firebaseResult.success) return;

      const firebaseUsers = firebaseResult.data;
      let updated = [...localUsers];
      let changed = false;

      firebaseUsers.forEach(fbUser => {
        const idx = updated.findIndex(u => u.email?.toLowerCase() === fbUser.email?.toLowerCase());
        if (idx !== -1) {
          if (!updated[idx].firebaseId) {
            updated[idx] = { ...updated[idx], firebaseId: fbUser.id };
            changed = true;
          }
        } else {
          updated.push({ ...fbUser, firebaseId: fbUser.id });
          changed = true;
        }
      });

      if (changed) localStorage.setItem('users', JSON.stringify(updated));
    } catch {
      console.log('Firebase offline, using local data');
    }
  };

  // Login
  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
      let users = [];
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        try { users = JSON.parse(savedUsers); }
        catch { users = defaultUsers; }
      }

      if (!Array.isArray(users) || users.length === 0) {
        users = defaultUsers;
        localStorage.setItem('users', JSON.stringify(defaultUsers));
      }

      const user = users.find(u =>
        u.email?.toLowerCase().trim() === cleanEmail &&
        u.password?.trim() === cleanPassword
      );

      if (!user) {
        const emailExists = users.some(u => u.email?.toLowerCase().trim() === cleanEmail);
        return { success: false, error: emailExists ? 'Incorrect password' : 'Email not registered' };
      }

      if (user.status === 'inactive') return { success: false, error: 'Account inactive' };

      // Safe user info
      const safeUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        lastLogin: new Date().toISOString()
      };

      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(safeUser));

      // Background: save login session (without password)
      setTimeout(() => saveLoginSession(safeUser).catch(() => {}), 0);

      return { success: true, user: safeUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  // Create user locally and sync to Firebase
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

    // Firebase sync (without password)
    setTimeout(async () => {
      try {
        const { password, ...userWithoutPassword } = newUser;
        const result = await createUser({ ...userWithoutPassword, password: '123456' });
        if (result.success) {
          const finalUsers = updated.map(u => u.id === newUser.id ? { ...u, firebaseId: result.id } : u);
          localStorage.setItem('users', JSON.stringify(finalUsers));
        }
      } catch { console.log('Firebase sync pending for:', newUser.email); }
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
      const safeUser = { id: user.id, email: user.email, role: user.role };
      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(safeUser));
      return true;
    }
    return false;
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Loading...</div>;

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