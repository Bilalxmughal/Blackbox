import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Clock, Calendar, MessageSquare,
  Send, Building2, Phone, Tag, AlertCircle, UserCheck, X, Search
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { COMPLAINT_BY_OPTIONS, TICKET_STATUS, formatDateDDMMYYYY } from '../../data/complaintConfig'
import { defaultDepartments } from '../../data/users'
import { sendMentionEmail } from '../../utils/emailService'
import { updateComplaint } from '../../lib/firebase'
import styles from './ComplaintDetail.module.css'

// Render @mentions as highlighted spans in comment text
const renderCommentWithMentions = (text) => {
  const parts = text.split(/(@\w+(?:\s\w+)?)/g)
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className={styles.mentionTag}>{part}</span>
      : part
  )
}

function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const textareaRef = useRef(null)

  const [complaint, setComplaint] = useState(null)
  const [departments, setDepartments] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [activeTab, setActiveTab] = useState('details')
  const [notFound, setNotFound] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Comment states
  const [newComment, setNewComment] = useState('')
  const [isSending, setIsSending] = useState(false)

  // @mention states
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionDropdownPos, setMentionDropdownPos] = useState(0)

  // Comment search state
  const [commentSearch, setCommentSearch] = useState('')

  // Reassign states
  const [showReassign, setShowReassign] = useState(false)
  const [reassignData, setReassignData] = useState({ dept: '', userId: '', userName: '', reason: '' })

  // Load complaint from localStorage (already synced from Firebase by ComplaintBoard)
  useEffect(() => {
    const savedComplaints = localStorage.getItem('complaints')
    const complaints = savedComplaints ? JSON.parse(savedComplaints) : []
    const found = complaints.find(c => c.id === id)
    if (found) setComplaint(found)
    else setNotFound(true)

    const savedDepts = localStorage.getItem('departments')
    setDepartments(savedDepts ? JSON.parse(savedDepts) : defaultDepartments)

    const savedUsers = localStorage.getItem('users')
    setAllUsers(savedUsers ? JSON.parse(savedUsers) : [])
  }, [id])

  // ✅ Save complaint to both localStorage AND Firebase
  const saveComplaint = useCallback(async (updated) => {
    // Update localStorage immediately for instant UI
    const savedComplaints = localStorage.getItem('complaints')
    const complaints = savedComplaints ? JSON.parse(savedComplaints) : []
    const updatedList = complaints.map(c => c.id === updated.id ? updated : c)
    localStorage.setItem('complaints', JSON.stringify(updatedList))
    setComplaint(updated)

    // ✅ Sync to Firebase in background
    // id here is the Firebase document ID (set when complaint was created)
    if (updated.id && !updated.id.startsWith('comp-')) {
      try {
        const { id: _id, ...fieldsToUpdate } = updated
        await updateComplaint(updated.id, fieldsToUpdate)
        console.log('Complaint synced to Firebase:', updated.id)
      } catch (err) {
        console.error('Firebase sync failed:', err)
      }
    }
  }, [])

  const addNotification = useCallback((userId, message, ticketNo, type = 'mention') => {
    const saved = localStorage.getItem('notifications')
    const notifications = saved ? JSON.parse(saved) : []
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId, message, ticketNo, ticketId: id,
      type, read: false,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }, [id])

  // Handle @mention detection in textarea
  const handleCommentChange = (e) => {
    const value = e.target.value
    setNewComment(value)
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    if (atIndex !== -1) {
      const query = textBeforeCursor.slice(atIndex + 1)
      if (!query.includes(' ') || query.length === 0) {
        setMentionQuery(query)
        setShowMentionDropdown(true)
        setMentionDropdownPos(atIndex)
        return
      }
    }
    setShowMentionDropdown(false)
    setMentionQuery('')
  }

  // Users shown in @mention dropdown
  const mentionUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(mentionQuery.toLowerCase()) &&
    u.id !== currentUser?.id
  ).slice(0, 6)

  // Insert @mention into comment text
  const selectMention = (user) => {
    const beforeAt = newComment.slice(0, mentionDropdownPos)
    const afterCursor = newComment.slice(mentionDropdownPos + mentionQuery.length + 1)
    setNewComment(`${beforeAt}@${user.name} ${afterCursor}`)
    setShowMentionDropdown(false)
    setMentionQuery('')
    textareaRef.current?.focus()
  }

  // Extract mentioned users from comment text
  const parseMentions = (text) => {
    const mentionRegex = /@(\w+(?:\s\w+)?)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      const user = allUsers.find(u => u.name?.toLowerCase() === match[1].toLowerCase())
      if (user) mentions.push(user)
    }
    return mentions
  }

  // Add comment — saves to Firebase, sends mention emails/notifications
  const addComment = async () => {
    if (!newComment.trim() || !complaint || isSending) return
    setIsSending(true)

    const comment = {
      id: `cmt-${Date.now()}`,
      text: newComment.trim(),
      by: currentUser?.name,
      userId: currentUser?.id,
      timestamp: new Date().toISOString(),
      type: 'comment'
    }

    const updated = {
      ...complaint,
      comments: [...(complaint.comments || []), comment],
      activityLog: [
        ...(complaint.activityLog || []),
        {
          id: `act-${Date.now()}`,
          type: 'comment',
          text: `Comment added by ${currentUser?.name}`,
          by: currentUser?.name,
          timestamp: new Date().toISOString()
        }
      ]
    }

    await saveComplaint(updated)

    // Send notifications and emails for @mentions
    const mentionedUsers = parseMentions(newComment.trim())
    for (const user of mentionedUsers) {
      addNotification(
        user.id,
        `${currentUser?.name} mentioned you in ticket ${complaint.ticketNo}: "${newComment.trim().slice(0, 60)}..."`,
        complaint.ticketNo, 'mention'
      )
      if (user.email) {
        sendMentionEmail({
          toEmail: user.email, toName: user.name,
          fromName: currentUser?.name,
          commentText: newComment.trim(),
          ticketNo: complaint.ticketNo,
          ticketId: complaint.id
        }).catch(err => console.error('Email failed:', err))
      }
    }

    setNewComment('')
    setIsSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
      e.preventDefault()
      addComment()
    }
    if (e.key === 'Escape') setShowMentionDropdown(false)
  }

  // ✅ Update ticket status — saves to Firebase via saveComplaint
  const updateStatus = async (newStatus) => {
    if (!complaint) return
    const canChange =
      complaint.assignedToId === currentUser?.id ||
      complaint.assignedTo === currentUser?.name ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin'

    if (!canChange) { alert('Only assigned user or Admin can change status'); return }

    setIsSaving(true)
    const updated = {
      ...complaint,
      ticketStatus: newStatus,
      complaintStatus: newStatus === 'Closed' ? 'Resolved' : newStatus === 'In Progress' ? 'In Progress' : 'Pending',
      resolvedPercent: newStatus === 'Closed' ? 100 : newStatus === 'In Progress' ? 50 : 0,
      resolvedDate: newStatus === 'Closed' ? new Date().toISOString() : null,
      activityLog: [
        ...(complaint.activityLog || []),
        {
          id: `act-${Date.now()}`,
          type: 'status_change',
          text: `Status changed to "${newStatus}" by ${currentUser?.name}`,
          by: currentUser?.name,
          fromStatus: complaint.ticketStatus,
          toStatus: newStatus,
          timestamp: new Date().toISOString()
        }
      ]
    }

    await saveComplaint(updated)
    setIsSaving(false)
  }

  // ✅ Reassign ticket — saves to Firebase via saveComplaint
  const handleReassign = async () => {
    if (!reassignData.dept || !reassignData.userId || !reassignData.reason.trim()) {
      alert('Please fill all fields including reason'); return
    }

    const oldAssignedId = complaint.assignedToId
    const oldAssignedName = complaint.assignedTo

    const updated = {
      ...complaint,
      assignedDept: reassignData.dept,
      assignedTo: reassignData.userName,
      assignedToId: reassignData.userId,
      assignedToName: reassignData.userName,
      reassignHistory: [
        ...(complaint.reassignHistory || []),
        {
          id: `reas-${Date.now()}`,
          fromUser: oldAssignedName, fromUserId: oldAssignedId,
          toUser: reassignData.userName, toUserId: reassignData.userId,
          toDept: reassignData.dept,
          reason: reassignData.reason.trim(),
          reassignedBy: currentUser?.name, reassignedById: currentUser?.id,
          timestamp: new Date().toISOString()
        }
      ],
      activityLog: [
        ...(complaint.activityLog || []),
        {
          id: `act-${Date.now()}`,
          type: 'reassign',
          text: `Ticket reassigned from "${oldAssignedName}" to "${reassignData.userName}" (${reassignData.dept}) by ${currentUser?.name}. Reason: ${reassignData.reason}`,
          by: currentUser?.name,
          timestamp: new Date().toISOString()
        }
      ]
    }

    await saveComplaint(updated)

    if (oldAssignedId) {
      addNotification(oldAssignedId,
        `Ticket ${complaint.ticketNo} has been reassigned from you to ${reassignData.userName} by ${currentUser?.name}. Reason: ${reassignData.reason}`,
        complaint.ticketNo, 'reassign')
    }
    addNotification(reassignData.userId,
      `Ticket ${complaint.ticketNo} has been assigned to you by ${currentUser?.name}.`,
      complaint.ticketNo, 'reassign')

    setShowReassign(false)
    setReassignData({ dept: '', userId: '', userName: '', reason: '' })
  }

  // Filtered comments by search term
  const filteredComments = (complaint?.comments || []).filter(c =>
    !commentSearch ||
    c.text?.toLowerCase().includes(commentSearch.toLowerCase()) ||
    c.by?.toLowerCase().includes(commentSearch.toLowerCase())
  )

  const availableUsersForReassign = reassignData.dept
    ? allUsers.filter(u => u.department === reassignData.dept && u.status === 'active')
    : []

  const canReassign = complaint?.submittedById === currentUser?.id ||
    currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
  const canChangeStatus = complaint?.assignedToId === currentUser?.id ||
    complaint?.assignedTo === currentUser?.name ||
    currentUser?.role === 'admin' || currentUser?.role === 'super_admin'

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <AlertCircle size={48} />
        <h2>Ticket not found</h2>
        <button onClick={() => navigate('/complaints')}>Back to Complaints</button>
      </div>
    )
  }
  if (!complaint) return <div className={styles.loading}>Loading...</div>

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/complaints')}>
          <ArrowLeft size={18} /> Back to Complaints
        </button>
        <div className={styles.ticketMeta}>
          <span className={styles.ticketNo}>{complaint.ticketNo}</span>
          <span className={styles.submittedInfo}>
            Created {formatDateDDMMYYYY(complaint.date)} by {complaint.submittedBy}
            {isSaving && <span style={{ color: '#00d4ff', marginLeft: 8 }}>Saving...</span>}
          </span>
        </div>
        {canReassign && (
          <button
            className={`${styles.reassignTriggerBtn} ${showReassign ? styles.cancelMode : ''}`}
            onClick={() => setShowReassign(!showReassign)}
          >
            {showReassign ? <><X size={16} /> Cancel</> : <><UserCheck size={16} /> Reassign Ticket</>}
          </button>
        )}
      </div>

      {/* Reassign Panel */}
      {showReassign && (
        <div className={styles.reassignPanel}>
          <div className={styles.reassignHeader}>
            <h3><UserCheck size={18} /> Reassign Ticket</h3>
            <span className={styles.reassignCurrent}>
              Currently: <strong>{complaint.assignedTo}</strong> — {complaint.assignedDept}
            </span>
          </div>
          <div className={styles.reassignForm}>
            <div className={styles.reassignField}>
              <label>New Department *</label>
              <select value={reassignData.dept}
                onChange={(e) => setReassignData({ ...reassignData, dept: e.target.value, userId: '', userName: '' })}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className={styles.reassignField}>
              <label>Assign To *</label>
              <select value={reassignData.userId}
                onChange={(e) => {
                  const u = availableUsersForReassign.find(u => u.id === e.target.value)
                  setReassignData({ ...reassignData, userId: e.target.value, userName: u?.name || '' })
                }}
                disabled={!reassignData.dept}>
                <option value="">Select User</option>
                {availableUsersForReassign.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              {reassignData.dept && availableUsersForReassign.length === 0 && (
                <small className={styles.noUsers}>No active users in this department</small>
              )}
            </div>
            <div className={`${styles.reassignField} ${styles.fullField}`}>
              <label>Reason *</label>
              <textarea rows="3" placeholder="Why is this ticket being reassigned?"
                value={reassignData.reason}
                onChange={(e) => setReassignData({ ...reassignData, reason: e.target.value })} />
            </div>
          </div>
          <div className={styles.reassignActions}>
            <button className={styles.confirmReassignBtn} onClick={handleReassign}
              disabled={!reassignData.dept || !reassignData.userId || !reassignData.reason.trim()}>
              <UserCheck size={16} /> Confirm Reassign
            </button>
          </div>
        </div>
      )}

      {/* Info Row */}
      <div className={styles.infoRow}>
        <div className={styles.infoCard}><Calendar size={18} color="#00d4ff" /><div><label>Date</label><span>{formatDateDDMMYYYY(complaint.date)}</span></div></div>
        <div className={styles.infoCard}><User size={18} color="#00d4ff" /><div><label>Submitted By</label><span>{complaint.submittedBy}</span></div></div>
        <div className={styles.infoCard}><Building2 size={18} color="#00d4ff" /><div><label>Department</label><span>{complaint.assignedDept}</span></div></div>
        <div className={styles.infoCard}><User size={18} color="#00d4ff" /><div><label>Assigned To</label><span className={styles.assignedName}>{complaint.assignedTo}</span></div></div>
        <div className={styles.infoCard}>
          <Tag size={18} color="#00d4ff" />
          <div><label>Priority</label><span className={`${styles.priority} ${styles[complaint.priority]}`}>{complaint.priority?.toUpperCase()}</span></div>
        </div>
      </div>

      {/* Status Control */}
      <div className={styles.statusSection}>
        <label>Ticket Status</label>
        <div className={styles.statusButtons}>
          {Object.values(TICKET_STATUS).map(status => (
            <button key={status.value} className={styles.statusBtn}
              style={{
                background: complaint.ticketStatus === status.value ? status.bg : '#f5f5f5',
                color: complaint.ticketStatus === status.value ? status.color : '#666',
                opacity: isSaving ? 0.6 : 1
              }}
              onClick={() => !isSaving && canChangeStatus && updateStatus(status.value)}
              disabled={!canChangeStatus || isSaving}>
              {status.label}
            </button>
          ))}
        </div>
        {!canChangeStatus && (
          <span className={styles.permissionNote}>Only {complaint.assignedTo} or Admin can change status</span>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={activeTab === 'details' ? styles.activeTab : ''} onClick={() => setActiveTab('details')}>Details</button>
        <button className={activeTab === 'comments' ? styles.activeTab : ''} onClick={() => setActiveTab('comments')}>
          <MessageSquare size={15} /> Comments ({complaint.comments?.length || 0})
        </button>
        <button className={activeTab === 'history' ? styles.activeTab : ''} onClick={() => setActiveTab('history')}>
          <Clock size={15} /> History
        </button>
        {complaint.reassignHistory?.length > 0 && (
          <button className={activeTab === 'reassign' ? styles.activeTab : ''} onClick={() => setActiveTab('reassign')}>
            <UserCheck size={15} /> Reassign Log ({complaint.reassignHistory.length})
          </button>
        )}
      </div>

      <div className={styles.tabContent}>

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className={styles.detailsGrid}>
            <div className={styles.detailCard}>
              <h3>Route Information</h3>
              <div className={styles.detailItems}>
                <div className={styles.detailItem}><label>Route Name</label><span>{complaint.routeName || '-'}</span></div>
                <div className={styles.detailItem}><label>Company</label><span>{complaint.company || '-'}</span></div>
                <div className={styles.detailItem}><label>Bus Number</label><span>{complaint.busNumber || '-'}</span></div>
                <div className={styles.detailItem}><label>Captain Name</label><span>{complaint.captainName || '-'}</span></div>
                <div className={styles.detailItem}><label><Phone size={12} /> Captain Contact</label><span>{complaint.captainContact || '-'}</span></div>
                <div className={styles.detailItem}><label>Vendor Name</label><span>{complaint.vendorName || '-'}</span></div>
                <div className={styles.detailItem}><label><Phone size={12} /> Vendor Contact</label><span>{complaint.vendorContact || '-'}</span></div>
              </div>
            </div>
            <div className={styles.detailCard}>
              <h3>Issue Information</h3>
              <div className={styles.detailItems}>
                <div className={styles.detailItem}><label>Category</label><span>{complaint.issueCategoryName || '-'}</span></div>
                <div className={styles.detailItem}><label>Sub Category</label><span>{complaint.issueSubCategoryName || '-'}</span></div>
                <div className={styles.detailItem}>
                  <label>Source</label>
                  <span className={`${styles.sourceBadge} ${styles[complaint.complaintBy]}`}>
                    {COMPLAINT_BY_OPTIONS.find(o => o.value === complaint.complaintBy)?.label || 'Client'}
                  </span>
                </div>
              </div>
            </div>
            <div className={`${styles.detailCard} ${styles.fullWidth}`}>
              <h3>Issue Details</h3>
              <p className={styles.issueText}>{complaint.issueDetails}</p>
            </div>
          </div>
        )}

        {/* COMMENTS TAB */}
        {activeTab === 'comments' && (
          <div className={styles.commentsSection}>
            <div className={styles.commentSearch}>
              <Search size={16} color="#aaa" />
              <input type="text" placeholder="Search in comments..."
                value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)} />
              {commentSearch && (
                <button onClick={() => setCommentSearch('')} className={styles.clearSearch}><X size={14} /></button>
              )}
            </div>

            <div className={styles.commentsList}>
              {filteredComments.length === 0 ? (
                <p className={styles.noComments}>
                  {commentSearch ? `No comments matching "${commentSearch}"` : 'No comments yet. Be the first to comment!'}
                </p>
              ) : (
                filteredComments.map(comment => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>{comment.by}</span>
                      <span className={styles.commentTime}>
                        {formatDateDDMMYYYY(comment.timestamp)} {new Date(comment.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={styles.commentText}>{renderCommentWithMentions(comment.text)}</p>
                  </div>
                ))
              )}
            </div>

            <div className={styles.commentInput}>
              <div className={styles.commentInputWrapper}>
                <textarea ref={textareaRef}
                  placeholder="Add a comment... Type @ to mention someone"
                  value={newComment} onChange={handleCommentChange} onKeyDown={handleKeyDown} rows="3" />
                {showMentionDropdown && mentionUsers.length > 0 && (
                  <div className={styles.mentionDropdown}>
                    <div className={styles.mentionDropdownHeader}><User size={12} /> Mention a user</div>
                    {mentionUsers.map(user => (
                      <button key={user.id} className={styles.mentionOption} onClick={() => selectMention(user)} type="button">
                        <div className={styles.mentionAvatar}>{user.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <span className={styles.mentionName}>{user.name}</span>
                          <span className={styles.mentionDept}>{user.department}</span>
                        </div>
                        {user.email && <span className={styles.mentionEmail}>{user.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.commentActions}>
                <span className={styles.commentHint}>@ mention • Enter to send • Shift+Enter new line</span>
                <button className={styles.sendBtn} onClick={addComment} disabled={!newComment.trim() || isSending}>
                  <Send size={16} /> {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className={styles.historySection}>
            <div className={styles.timeline}>
              {(complaint.activityLog || []).map((activity, index) => (
                <div key={activity.id || index} className={`${styles.timelineItem} ${styles[`dot_${activity.type}`]}`}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <p>{activity.text}</p>
                    <span>{formatDateDDMMYYYY(activity.timestamp)} {new Date(activity.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REASSIGN LOG TAB */}
        {activeTab === 'reassign' && (
          <div className={styles.historySection}>
            <div className={styles.timeline}>
              {(complaint.reassignHistory || []).map((entry, index) => (
                <div key={entry.id || index} className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.reassignDot}`} />
                  <div className={styles.timelineContent}>
                    <div className={styles.reassignEntry}>
                      <div className={styles.reassignRow}>
                        <span>From: <strong>{entry.fromUser}</strong></span>
                        <span className={styles.arrow}>→</span>
                        <span>To: <strong>{entry.toUser}</strong> ({entry.toDept})</span>
                      </div>
                      <div className={styles.reassignReason}><label>Reason:</label><p>{entry.reason}</p></div>
                      <span className={styles.reassignMeta}>
                        By {entry.reassignedBy} • {formatDateDDMMYYYY(entry.timestamp)} {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComplaintDetail