import { createContext, useContext, useState, useEffect } from 'react';
import { getAllUsers, saveLoginSession, createUser, updateUser } from '../lib/firebase';
import { defaultUsers, ROLES } from '../data/users';

const AuthContext = createContext(null);

// Safe user object — password never included
const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Restore session immediately (no network needed)
        const savedSession = localStorage.getItem('currentUser');
        if (savedSession) {
          try {
            const sessionUser = JSON.parse(savedSession);
            setCurrentUser(sessionUser);
            setIsAuthenticated(true);
          } catch {
            localStorage.removeItem('currentUser');
          }
        }

        // Load users from Firebase (source of truth)
        const result = await getAllUsers();

        if (result.success && result.data.length > 0) {
          // Firebase has users — cache safe fields only (no passwords)
          const safeUsers = result.data.map(sanitizeUser);
          localStorage.setItem('users', JSON.stringify(safeUsers));
        } else {
          // Firebase empty on first run — seed default users
          await seedDefaultUsers();
        }
      } catch {
        // Firebase unreachable — ensure local fallback exists
        ensureLocalFallback();
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Seed default users into Firebase (first run only)
  const seedDefaultUsers = async () => {
    try {
      for (const user of defaultUsers) {
        await createUser(user); // firebase.js strips password before Firestore write
      }
      // Cache safe versions locally
      localStorage.setItem('users', JSON.stringify(defaultUsers.map(sanitizeUser)));
    } catch {
      ensureLocalFallback();
    }
  };

  // Last resort fallback — no passwords stored
  const ensureLocalFallback = () => {
    const saved = localStorage.getItem('users');
    if (!saved || saved === '[]') {
      localStorage.setItem('users', JSON.stringify(defaultUsers.map(sanitizeUser)));
    }
  };

  // Login — always checks Firebase first, falls back to defaultUsers if offline
  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
      // Firebase is source of truth for auth
      // NOTE: Firestore users don't have passwords (by design) —
      // so we match email from Firebase, then verify password from defaultUsers
      // This works until you implement Firebase Auth properly.
      const result = await getAllUsers();

      let usersWithPasswords = [...defaultUsers];

      if (result.success && result.data.length > 0) {
        // Merge Firebase user data with defaultUsers passwords for verification
        usersWithPasswords = result.data.map(fbUser => {
          const localDefault = defaultUsers.find(
            d => d.email.toLowerCase() === fbUser.email?.toLowerCase()
          );
          return { ...fbUser, firebaseId: fbUser.id, password: localDefault?.password || fbUser.password };
        });
      }

      const user = usersWithPasswords.find(u =>
        u.email?.toLowerCase().trim() === cleanEmail &&
        u.password?.trim() === cleanPassword
      );

      if (!user) {
        const emailExists = usersWithPasswords.some(
          u => u.email?.toLowerCase().trim() === cleanEmail
        );
        return {
          success: false,
          error: emailExists ? 'Incorrect password' : 'Email not registered'
        };
      }

      if (user.status === 'inactive') {
        return { success: false, error: 'Account inactive. Contact your administrator.' };
      }

      // firebaseId = actual Firestore document ID (from getAllUsers result)
      // id = local fallback ID (user-1, user-2 etc) — never use for Firestore writes
      const firestoreDocId = user.firebaseId || null;

      // Session — password never included
      const safeUser = {
        id: user.id,
        firebaseId: firestoreDocId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: new Date().toISOString()
      };

      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(safeUser));

      // Background updates — only if we have a real Firestore doc ID
      setTimeout(() => {
        if (firestoreDocId) {
          updateUser(firestoreDocId, { lastLogin: new Date().toISOString() }).catch(() => {});
        }
        saveLoginSession(safeUser).catch(() => {});
      }, 0);

      return { success: true, user: safeUser };

    } catch {
      // Firebase offline — fallback to defaultUsers
      return loginOffline(cleanEmail, cleanPassword);
    }
  };

  // Offline login — only works for defaultUsers (passwords available in memory)
  const loginOffline = (email, password) => {
    const user = defaultUsers.find(u =>
      u.email?.toLowerCase().trim() === email &&
      u.password?.trim() === password
    );

    if (!user) return { success: false, error: 'Login failed. Check your connection.' };
    if (user.status === 'inactive') return { success: false, error: 'Account inactive.' };

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      lastLogin: new Date().toISOString()
    };

    setCurrentUser(safeUser);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(safeUser));

    return { success: true, user: safeUser };
  };

  const createUserInstant = async (userData) => {
    // firebase.js strips password before Firestore write
    const result = await createUser(userData);
    if (!result.success) return { success: false, error: result.error };

    const safeUser = {
      ...sanitizeUser(userData),
      firebaseId: result.id,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Update local cache (password-free)
    const saved = localStorage.getItem('users');
    const users = saved ? JSON.parse(saved) : [];
    localStorage.setItem('users', JSON.stringify([...users, safeUser]));

    return { success: true, user: safeUser };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const resetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const forceLogin = (email) => {
    const user = defaultUsers.find(u =>
      u.email?.toLowerCase() === email.toLowerCase().trim()
    );
    if (user) {
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      };
      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(safeUser));
      return true;
    }
    return false;
  };


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