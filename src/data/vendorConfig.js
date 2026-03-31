// src/data/vendorConfig.js

// ✅ VENDOR STATUS (Active/Non Active)
export const VENDOR_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Non Active' }
]

// ✅ FILER STATUS (Yes/No)
export const FILER_STATUS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

export const BANK_NAMES = [
  { value: 'Habib Bank Limited (HBL)', label: 'Habib Bank Limited (HBL)' },
  { value: 'United Bank Limited (UBL)', label: 'United Bank Limited (UBL)' },
  { value: 'MCB Bank', label: 'MCB Bank' },
  { value: 'Allied Bank Limited (ABL)', label: 'Allied Bank Limited (ABL)' },
  { value: 'National Bank of Pakistan (NBP)', label: 'National Bank of Pakistan (NBP)' },
  { value: 'Bank of Punjab (BOP)', label: 'Bank of Punjab (BOP)' },
  { value: 'Meezan Bank', label: 'Meezan Bank' },
  { value: 'Bank Alfalah', label: 'Bank Alfalah' },
  { value: 'Habib Metro', label: 'Habib Metro' },
  { value: 'Faysal Bank', label: 'Faysal Bank' },
  { value: 'Askari Bank', label: 'Askari Bank' },
  { value: 'Soneri Bank', label: 'Soneri Bank' },
  { value: 'JS Bank', label: 'JS Bank' },
  { value: 'Silk Bank', label: 'Silk Bank' },
  { value: 'Summit Bank', label: 'Summit Bank' },
  { value: 'Al Habib Bank', label: 'Al Habib Bank' },
  { value: 'Other', label: 'Other' }
]

// Format CNIC: 00000-0000000-0
export const formatCNIC = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  if (digits.length <= 5) return digits
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
}

// Format Phone: 300 0000000
export const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

// Validate functions
export const validatePhone = (phone) => {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10
}

export const validateCNIC = (cnic) => {
  const digits = cnic.replace(/\D/g, '')
  return digits.length === 13
}

// Generate Vendor ID: VEN-0001
export const generateVendorId = (existingVendors = []) => {
  const maxId = existingVendors.reduce((max, v) => {
    const match = v.vendorId?.match(/VEN-(\d{4})/)
    const num = match ? parseInt(match[1]) : 0
    return Math.max(max, num)
  }, 0)
  
  const nextId = maxId + 1
  return `VEN-${String(nextId).padStart(4, '0')}`
}

// Permissions
export const canAddVendor = (user) => {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

export const canEditVendor = (user) => {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

export const canDeleteVendor = (user) => {
  return user?.role === 'super_admin'
}