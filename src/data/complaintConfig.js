// Complaint configuration and utilities

export const COMPLAINT_BY_OPTIONS = [
  { value: 'client', label: 'Client', color: '#4caf50' },
  { value: 'internal', label: 'Internal', color: '#ff9800' }
]

export const TICKET_STATUS = {
  OPEN: { value: 'Open', label: 'Open', color: '#ff6b6b', bg: '#ffebee' },
  IN_PROGRESS: { value: 'In Progress', label: 'In Progress', color: '#ffa726', bg: '#fff3e0' },
  CLOSED: { value: 'Closed', label: 'Closed', color: '#66bb6a', bg: '#e8f5e9' }
}

export const formatDateDDMMYYYY = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}-${month}-${year}`
}

export const generateTicketNo = (categoryCode, date) => {
  const d = new Date(date)
  const year = d.getFullYear().toString().slice(-2)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  
  return `${categoryCode}-${year}${month}${day}-${random}`
}