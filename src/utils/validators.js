// Email validation
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone number validation (Pakistani format)
export function isValidPhone(phone) {
  // Accepts formats: 0300-1234567, 03001234567, +92300-1234567
  const phoneRegex = /^(\+92|0)?[0-9]{3}-?[0-9]{7}$/
  return phoneRegex.test(phone)
}

// CNIC validation (Pakistani format: 12345-1234567-1)
export function isValidCNIC(cnic) {
  const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/
  return cnicRegex.test(cnic)
}

// Required field validation
export function isRequired(value) {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined && value !== ''
}

// Minimum length validation
export function minLength(value, min) {
  return String(value).length >= min
}

// Maximum length validation
export function maxLength(value, max) {
  return String(value).length <= max
}

// Number validation
export function isNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

// Positive number validation
export function isPositiveNumber(value) {
  return isNumber(value) && parseFloat(value) > 0
}

// Date validation
export function isValidDate(dateString) {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

// Date range validation (not in future)
export function isPastOrToday(dateString) {
  const inputDate = new Date(dateString)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return inputDate <= today
}

// IBAN validation (Pakistani format: PK36ABCD...)
export function isValidIBAN(iban) {
  const ibanRegex = /^PK[0-9]{2}[A-Z]{4}[0-9]{16,24}$/
  return ibanRegex.test(iban.replace(/\s/g, ''))
}

// Ticket number validation format: XXX-DDMMYY-NNN
export function isValidTicketFormat(ticketNo) {
  const ticketRegex = /^[A-Z]{3}-\d{6}-\d{3}$/
  return ticketRegex.test(ticketNo)
}

// Validate complaint form
export function validateComplaintForm(data) {
  const errors = {}

  if (!isRequired(data.routeName)) {
    errors.routeName = 'Route name is required'
  }

  if (!isRequired(data.issueCategory)) {
    errors.issueCategory = 'Issue category is required'
  }

  if (!isRequired(data.issueType)) {
    errors.issueType = 'Issue type is required'
  }

  if (!isRequired(data.issueDetails)) {
    errors.issueDetails = 'Issue details are required'
  } else if (minLength(data.issueDetails, 10)) {
    errors.issueDetails = 'Issue details must be at least 10 characters'
  }

  if (data.captainContact && !isValidPhone(data.captainContact)) {
    errors.captainContact = 'Invalid phone number format'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate category form
export function validateCategoryForm(data) {
  const errors = {}

  if (!isRequired(data.name)) {
    errors.name = 'Category name is required'
  }

  if (!isRequired(data.code)) {
    errors.code = 'Category code is required'
  } else if (!/^[A-Z]{3}$/.test(data.code)) {
    errors.code = 'Code must be exactly 3 uppercase letters'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate sub-category form
export function validateSubCategoryForm(data) {
  const errors = {}

  if (!isRequired(data.name)) {
    errors.name = 'Sub-category name is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Sanitize string (remove special characters)
export function sanitizeString(str) {
  return String(str)
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
}

// Format validation errors for display
export function formatErrors(errors) {
  return Object.entries(errors).map(([field, message]) => ({
    field,
    message
  }))
}

// Check if all required fields are filled
export function checkRequiredFields(data, requiredFields) {
  const missing = []
  
  requiredFields.forEach(field => {
    if (!isRequired(data[field])) {
      missing.push(field)
    }
  })

  return {
    isComplete: missing.length === 0,
    missing
  }
}