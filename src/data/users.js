export const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Admin',
    permissions: ['all']
  },
  ADMIN: {
    id: 'admin',
    name: 'Admin',
    permissions: ['view_users', 'add_user', 'edit_user', 'delete_user', 'view_departments', 'manage_departments']
  },
  OPS: {
    id: 'ops',
    name: 'Operations',
    permissions: ['view_users', 'view_departments', 'request_add_user', 'request_edit_user']
  },
  USER: {
    id: 'user',
    name: 'User',
    permissions: ['view_own_profile']
  }
};

export const defaultDepartments = [
  { id: 'dept-1', name: 'HR' },
  { id: 'dept-2', name: 'IT' },
  { id: 'dept-3', name: 'Operations' },
  { id: 'dept-4', name: 'Finance' }
];

export const defaultUsers = [
  {
    id: 'user-1',
    name: 'Super Admin',
    email: 'super@buscaro.com',
    phone: '+92-300-1234567',
    password: 'admin123',
    department: 'IT',
    role: 'super_admin',
    status: 'active',
    createdAt: new Date().toISOString()
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
];

export const getPendingRequests = () => {
  const saved = localStorage.getItem('pendingRequests');
  return saved ? JSON.parse(saved) : [];
};

export const savePendingRequest = (request) => {
  const requests = getPendingRequests();
  requests.push({
    id: `req-${Date.now()}`,
    ...request,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('pendingRequests', JSON.stringify(requests));
};