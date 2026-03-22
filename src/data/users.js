// ==========================================
// ROLES CONFIGURATION
// ==========================================

export const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Admin',
    permissions: ['all'],
    level: 4,
    description: 'Complete system control'
  },
  ADMIN: {
    id: 'admin',
    name: 'Admin',
    permissions: [
      'view_users', 
      'add_user', 
      'edit_user_basic', 
      'delete_user',
      'view_departments',
      'view_categories',
      'add_complaint',
      'edit_complaint',
      'view_reports'
    ],
    level: 3,
    description: 'Can manage users but NOT roles or Super Admin accounts'
  },
  OPS: {
    id: 'ops',
    name: 'Operations',
    permissions: [
      'view_own_profile',
      'edit_own_profile',
      'add_complaint',
      'view_complaints'
    ],
    level: 2,
    description: 'Limited access, requests needed for changes'
  },
  USER: {
    id: 'user',
    name: 'User',
    permissions: ['view_own_profile'],
    level: 1,
    description: 'Basic user access'
  }
}

// ==========================================
// DEFAULT DATA
// ==========================================

export const defaultUsers = [
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
    createdAt: new Date().toISOString(),
    lastLogin: null
  },
  {
    id: 'user-3',
    name: 'Ops User',
    email: 'bilalxmughal@gmail.com',
    phone: '+92-300-1112223',
    password: 'admin123',
    department: 'Operations',
    role: 'ops',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: null
  }
]

export const defaultDepartments = [
  { id: 'dept-1', name: 'Management', createdAt: new Date().toISOString() },
  { id: 'dept-2', name: 'HR', createdAt: new Date().toISOString() },
  { id: 'dept-3', name: 'Operations', createdAt: new Date().toISOString() },
  { id: 'dept-4', name: 'Finance', createdAt: new Date().toISOString() },
  { id: 'dept-5', name: 'IT', createdAt: new Date().toISOString() }
]

// ==========================================
// PENDING REQUESTS SYSTEM
// ==========================================

export const getPendingRequests = () => {
  const saved = localStorage.getItem('pendingRequests')
  return saved ? JSON.parse(saved) : []
}

export const savePendingRequest = (request) => {
  const requests = getPendingRequests()
  const newRequest = {
    id: `req-${Date.now()}`,
    ...request,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  requests.push(newRequest)
  localStorage.setItem('pendingRequests', JSON.stringify(requests))
  return newRequest
}

export const updateRequestStatus = (requestId, status) => {
  const requests = getPendingRequests()
  const updated = requests.filter(r => r.id !== requestId)
  localStorage.setItem('pendingRequests', JSON.stringify(updated))
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false
  const role = Object.values(ROLES).find(r => r.id === user.role)
  if (!role) return false
  if (role.permissions.includes('all')) return true
  return role.permissions.includes(permission)
}

export const canManageUser = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false
  
  const currentRole = ROLES[currentUser.role?.toUpperCase()]
  const targetRole = ROLES[targetUser.role?.toUpperCase()]
  
  if (!currentRole || !targetRole) return false
  
  // Super Admin can manage everyone except themselves (for safety)
  if (currentUser.role === 'super_admin') {
    return currentUser.id !== targetUser.id
  }
  
  // Admin can manage Ops and User, but not Super Admin or other Admins
  if (currentUser.role === 'admin') {
    return targetRole.level < currentRole.level
  }
  
  return false
}

export const canChangeRole = (currentUser) => {
  return currentUser?.role === 'super_admin'
}

// ==========================================
// FORCE RESET FUNCTION - Call this if login fails
// ==========================================

export const forceResetUsers = () => {
  console.log('🔄 FORCING RESET TO DEFAULT USERS...')
  localStorage.removeItem('users')
  localStorage.setItem('users', JSON.stringify(defaultUsers))
  console.log('✅ Reset complete. Default users restored.')
  console.log('Users now:', defaultUsers.map(u => ({ email: u.email, password: u.password })))
  return defaultUsers
}

// Auto-check on load
const checkAndFixUsers = () => {
  try {
    const saved = localStorage.getItem('users')
    
    // If no data or corrupted
    if (!saved || saved === 'null' || saved === 'undefined' || saved === '[]') {
      console.log('⚠️ No valid users found in localStorage')
      forceResetUsers()
      return
    }
    
    const parsed = JSON.parse(saved)
    
    // If not array or empty
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.log('⚠️ Users data corrupted or empty')
      forceResetUsers()
      return
    }
    
    // If Super Admin missing
    const hasSuper = parsed.some(u => u.email === 'super@buscaro.com')
    if (!hasSuper) {
      console.log('⚠️ Super Admin not found in saved data')
      forceResetUsers()
      return
    }
    
    console.log('✅ Users data valid. Count:', parsed.length)
    
  } catch (e) {
    console.error('❌ Error checking users:', e)
    forceResetUsers()
  }
}

// Run immediately when this file loads
checkAndFixUsers()