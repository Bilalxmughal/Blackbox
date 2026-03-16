export const defaultUsers = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@buscaro.com',
    password: 'admin123', // In production, hash this
    role: 'admin',
    department: 'Management'
  },
  {
    id: 'user-2',
    name: 'Ali Khan',
    email: 'ali@buscaro.com',
    password: 'ali123',
    role: 'user',
    department: 'Sales'
  },
  {
    id: 'user-3',
    name: 'Sara Ahmed',
    email: 'sara@buscaro.com',
    password: 'sara123',
    role: 'user',
    department: 'Operations'
  },
  {
    id: 'user-4',
    name: 'Bilal Hassan',
    email: 'bilal@buscaro.com',
    password: 'bilal123',
    role: 'user',
    department: 'Sales'
  }
]

export const defaultDepartments = [
  {
    id: 'dept-1',
    name: 'Sales',
    users: ['user-2', 'user-4']
  },
  {
    id: 'dept-2',
    name: 'Operations',
    users: ['user-3']
  },
  {
    id: 'dept-3',
    name: 'Management',
    users: ['user-1']
  },
  {
    id: 'dept-4',
    name: 'Vehicle Maintenance',
    users: []
  },
  {
    id: 'dept-5',
    name: 'Finance',
    users: []
  }
]