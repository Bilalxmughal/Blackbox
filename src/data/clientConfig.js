// Client configuration constants
export const CLIENT_LOCATIONS = [
  { value: 'lahore', label: 'Lahore' },
  { value: 'karachi', label: 'Karachi' },
  { value: 'islamabad', label: 'Islamabad' }
]

export const BUSINESS_TYPES = [
  { value: 'b2b', label: 'B2B' },
  { value: 'b2c', label: 'B2C' },
  { value: 'b2b2c', label: 'B2B2C' }
]

export const INDUSTRIES = [
  { value: 'transportation', label: 'Transportation' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' }
]

// Generate unique 4-digit client ID
export const generateClientId = (existingClients = []) => {
  const usedIds = existingClients.map(c => parseInt(c.clientId?.replace('CLI-', '') || 0))
  let newId = 1000 // Start from 1000
  
  while (usedIds.includes(newId)) {
    newId++
  }
  
  return `CLI-${newId}`
}

// Permission helpers for clients
export const canAddClient = (currentUser) => {
  return ['super_admin', 'admin', 'ops'].includes(currentUser?.role)
}

export const canEditClient = (currentUser) => {
  return ['super_admin', 'admin'].includes(currentUser?.role)
}

export const canDeleteClient = (currentUser) => {
  return currentUser?.role === 'super_admin'
}

export const canViewClients = (currentUser) => {
  return !!currentUser // All authenticated users can view
}