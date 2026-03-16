export function generateTicketNo(categoryCode, dateStr) {
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  
  // Get existing tickets from localStorage to find next number
  const existingTickets = JSON.parse(localStorage.getItem('complaints') || '[]')
  const todayTickets = existingTickets.filter(t => 
    t.ticketNo && t.ticketNo.startsWith(`${categoryCode}-${day}${month}${year}`)
  )
  
  const nextNum = String(todayTickets.length + 1).padStart(3, '0')
  
  return `${categoryCode}-${day}${month}${year}-${nextNum}`
}