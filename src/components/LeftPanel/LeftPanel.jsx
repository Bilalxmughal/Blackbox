import { useState, useMemo } from 'react'
import { Send, User, Clock, Calendar, MessageSquare } from 'lucide-react'
import Modal from '../Modal/Modal'
import styles from './LeftPanel.module.css'

function TicketDetail({ 
  ticket, 
  isOpen, 
  onClose, 
  onAddComment, 
  onReassign,
  isReassignMode,
  departments,
  currentUser 
}) {
  const [newComment, setNewComment] = useState('')
  const [reassignData, setReassignData] = useState({ dept: '', user: '' })

  // Get users list once
  const allUsers = useMemo(() => {
    return JSON.parse(localStorage.getItem('users')) || []
  }, [])

  // Get users for selected department
  const availableUsers = useMemo(() => {
    if (!reassignData.dept) return []
    const dept = departments.find(d => d.name === reassignData.dept)
    if (!dept || !dept.users) return []
    
    // Map user IDs to user objects
    return dept.users.map(userId => {
      const user = allUsers.find(u => u.id === userId)
      return user || { id: userId, name: 'Unknown User' }
    }).filter(Boolean)
  }, [reassignData.dept, departments, allUsers])

  const handleSubmitComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    onAddComment(ticket.id, newComment)
    setNewComment('')
  }

  const handleReassign = () => {
    if (reassignData.dept && reassignData.user) {
      onReassign(ticket.id, reassignData.dept, reassignData.user)
      setReassignData({ dept: '', user: '' })
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get category name from ID
  const getCategoryName = (catId) => {
    const cats = JSON.parse(localStorage.getItem('categories')) || []
    const cat = cats.find(c => c.id === catId)
    return cat ? cat.name : catId
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ticket ${ticket.ticketNo}`} size="xlarge">
      <div className={styles.detailContainer}>
        {/* Header Info */}
        <div className={styles.headerInfo}>
          <div className={styles.infoCard}>
            <Calendar size={16} />
            <div>
              <label>Submitted</label>
              <span>{formatDate(ticket.submittedAt || ticket.date)}</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <User size={16} />
            <div>
              <label>Submitted By</label>
              <span>{ticket.submittedBy}</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <Clock size={16} />
            <div>
              <label>Status</label>
              <span className={`${styles.status} ${styles[ticket.ticketStatus?.replace(' ', '')]}`}>
                {ticket.ticketStatus || 'Open'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.leftPanel}>
            <div className={styles.section}>
              <h3>Ticket Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Route</label>
                  <span>{ticket.routeName || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Account</label>
                  <span>{ticket.accountName || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Vendor</label>
                  <span>{ticket.vendorName || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Captain</label>
                  <span>{ticket.captainName || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Contact</label>
                  <span>{ticket.captainContact || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Department</label>
                  <span>{ticket.assignedDept || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Assigned To</label>
                  <span>{ticket.assignedTo || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Category</label>
                  <span>{getCategoryName(ticket.issueCategory)}</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3>Issue Details</h3>
              <p className={styles.issueText}>{ticket.issueDetails || 'No details provided'}</p>
              {ticket.ticketDetails && (
                <div className={styles.additionalInfo}>
                  <label>Additional Info:</label>
                  <p>{ticket.ticketDetails}</p>
                </div>
              )}
            </div>

            {/* Reassign Section */}
            {isReassignMode && (
              <div className={styles.section}>
                <h3>Reassign Ticket</h3>
                <div className={styles.reassignForm}>
                  <select
                    value={reassignData.dept}
                    onChange={(e) => setReassignData({ dept: e.target.value, user: '' })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={reassignData.user}
                    onChange={(e) => setReassignData({ ...reassignData, user: e.target.value })}
                    disabled={!reassignData.dept || availableUsers.length === 0}
                  >
                    <option value="">
                      {availableUsers.length === 0 ? 'No users in dept' : 'Select User'}
                    </option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.name}>{user.name}</option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={handleReassign} 
                    className={styles.reassignBtn}
                    disabled={!reassignData.dept || !reassignData.user}
                  >
                    Confirm Reassign
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className={styles.rightPanel}>
            <h3><MessageSquare size={18} /> Comments & Activity</h3>
            
            <div className={styles.commentsList}>
              {(ticket.comments || []).length === 0 ? (
                <p className={styles.noComments}>No comments yet</p>
              ) : (
                ticket.comments.map(comment => (
                  <div 
                    key={comment.id} 
                    className={`${styles.comment} ${styles[comment.type || 'comment']}`}
                  >
                    <div className={styles.commentHeader}>
                      <span className={styles.commentBy}>{comment.by || 'Unknown'}</span>
                      <span className={styles.commentTime}>
                        {formatDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmitComment} className={styles.commentForm}>
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="3"
              />
              <button type="submit" disabled={!newComment.trim()}>
                <Send size={16} />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default TicketDetail