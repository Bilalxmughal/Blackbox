import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  saveLoginSession,
  createComplaint,
  getAllComplaints 
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
        // Pehle Firebase se users check karo
        const firebaseUsers = await getAllUsers();
        
        if (firebaseUsers.success && firebaseUsers.data.length > 0) {
          console.log('Firebase se users loaded:', firebaseUsers.data.length);
          // Firebase users ko localStorage mein bhi sync karo
          localStorage.setItem('users', JSON.stringify(firebaseUsers.data));
        } else {
          // Agar Firebase mein nahi hain to localStorage check karo
          const savedUsers = localStorage.getItem('users');
          if (!savedUsers || savedUsers === 'null' || savedUsers === 'undefined') {
            console.log('No valid users found, setting defaults to Firebase...');
            // Default users ko Firebase mein bhi create karo
            for (const user of defaultUsers) {
              await createUser(user);
            }
            localStorage.setItem('users', JSON.stringify(defaultUsers));
          } else {
            const parsed = JSON.parse(savedUsers);
            if (!Array.isArray(parsed)) {
              throw new Error('Users is not an array');
            }
            console.log('Loaded users from localStorage:', parsed.length);
          }
        }
      } catch (e) {
        console.error('CORRUPTED DATA:', e);
        localStorage.clear();
        // Default users ko Firebase mein bhi create karo
        for (const user of defaultUsers) {
          await createUser(user);
        }
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        console.log('Data reset to defaults and saved to Firebase');
      }

      // Check for existing session
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          setCurrentUser(user);
          setIsAuthenticated(true);
          console.log('Restored session:', user.email);
        } catch (e) {
          localStorage.removeItem('currentUser');
        }
      }
      
      setIsLoading(false);
    };

    initializeData();
  }, []);

  const login = async (email, password) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Input email:', JSON.stringify(email));
    console.log('Input password:', JSON.stringify(password));

    // Normalize inputs
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();
    
    console.log('Clean email:', JSON.stringify(cleanEmail));
    console.log('Clean password:', JSON.stringify(cleanPassword));

    try {
      // Pehle Firebase se users lao
      let users = [];
      const firebaseResult = await getAllUsers();
      
      if (firebaseResult.success && firebaseResult.data.length > 0) {
        users = firebaseResult.data;
        console.log('Users from Firebase:', users.length);
      } else {
        // Fallback to localStorage
        const savedUsers = localStorage.getItem('users');
        users = savedUsers ? JSON.parse(savedUsers) : defaultUsers;
        console.log('Users from localStorage:', users.length);
      }

      // Debug: Show all users
      console.log('--- ALL USERS ---');
      users.forEach((u, i) => {
        console.log(`User ${i}:`, {
          email: JSON.stringify(u.email),
          password: JSON.stringify(u.password),
          emailMatch: u.email?.toLowerCase().trim() === cleanEmail,
          passwordMatch: u.password?.trim() === cleanPassword
        });
      });

      // Find user
      const user = users.find(u => {
        const userEmail = u.email?.toLowerCase().trim();
        const userPassword = u.password?.trim();
        
        const emailMatch = userEmail === cleanEmail;
        const passwordMatch = userPassword === cleanPassword;
        
        console.log(`Checking ${u.email}:`, { emailMatch, passwordMatch });
        
        return emailMatch && passwordMatch;
      });

      console.log('Found user:', user ? user.name : 'NO MATCH');

      if (!user) {
        // Check if email exists with wrong password
        const emailExists = users.some(u => 
          u.email?.toLowerCase().trim() === cleanEmail
        );
        
        if (emailExists) {
          console.log('Email exists but password wrong');
          return { success: false, error: 'Incorrect password' };
        }
        
        console.log('Email not found in system');
        return { success: false, error: 'Email not registered' };
      }

      // Check status
      if (user.status === 'inactive') {
        return { success: false, error: 'Account inactive. Contact Super Admin.' };
      }

      // ✅ LOGIN SESSION FIREBASE MEIN SAVE KARO
      const sessionResult = await saveLoginSession(user);
      if (sessionResult.success) {
        console.log('Login session saved to Firebase');
      }

      // Success - update login time
      const updatedUser = { 
        ...user, 
        lastLogin: new Date().toISOString() 
      };
      
      // Update user in Firebase if it has an ID
      if (user.id && !user.id.startsWith('user-')) {
        await updateUser(user.id, { lastLogin: new Date().toISOString() });
      }
      
      // Update users array in localStorage
      const updatedUsers = users.map(u => 
        u.id === user.id ? updatedUser : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
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
  };

  const resetAllData = () => {
    console.log('=== RESETTING ALL DATA ===');
    localStorage.clear();
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    window.location.reload();
  };

  const forceLogin = (email) => {
    // Emergency bypass for testing
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
        fontFamily: 'sans-serif'
      }}>
        <div>Loading CRM...</div>
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