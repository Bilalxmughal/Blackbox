import { useState, useEffect } from 'react'
import { Plus, Eye, Edit2 } from 'lucide-react'
import DataTable from '../../components/DataTable/DataTable'
import Modal from '../../components/Modal/Modal'
import TicketForm from '../../components/TicketForm/TicketForm'
import { initialCategories } from '../../data/initialCategories'
import { formatDate, calculateDays } from '../../utils/dateFormatter'
import styles from './ComplaintBoard.module.css'

function ComplaintBoard() {
  const [complaints, setComplaints] = useState([])
  const [categories, setCategories] = useState([])
  const [opsData, setOpsData] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    // Load complaints
    const savedComplaints = localStorage.getItem('complaints')
    if (savedComplaints) {
      setComplaints(JSON.parse(savedComplaints))
    }

    // Load categories
    const savedCategories = localStorage.getItem('categories')
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    } else {
      setCategories(initialCategories)
      localStorage.setItem('categories', JSON.stringify(initialCategories))
    }

    // Load ops data
    const savedOpsData = localStorage.getItem('buscaroOpsData')
    if (savedOpsData) {
      setOpsData(JSON.parse(savedOpsData))
    }
  }, [])

  const handleAddComplaint = (complaintData) => {
    const newComplaints = [complaintData, ...complaints]
    setComplaints(newComplaints)
    localStorage.setItem('complaints', JSON.stringify(newComplaints))
    setIsModalOpen(false)
  }

  const handleStatusChange = (id, newStatus) => {
    const updated = complaints.map(c => {
      if (c.id === id) {
        const resolvedDate = newStatus === 'Closed' ? new Date().toISOString() : null
        const resolvedInDays = resolvedDate ? calculateDays(c.date, resolvedDate) : null
        const pendingDays = !resolvedDate ? calculateDays(c.date) : 0
        
        return {
          ...c,
          ticketStatus: newStatus,
          complaintStatus: newStatus === 'Closed' ? 'Resolved' : c.complaintStatus,
          resolvedDate,
          resolvedInDays,
          pendingDays,
          resolvedPercent: newStatus === 'Closed' ? 100 : 0
        }
      }
      return c
    })
    setComplaints(updated)
    localStorage.setItem('complaints', JSON.stringify(updated))
  }

  const columns = [
    { header: 'Date', accessor: 'date', render: (val) => formatDate(val) },
    { header: 'Ticket No', accessor: 'ticketNo' },
    { header: 'Route Name', accessor: 'routeName' },
    { header: 'Account Name', accessor: 'accountName' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'Captain Name', accessor: 'captainName' },
    { header: 'Captain Contact', accessor: 'captainContact' },
    { header: 'Issue Category', accessor: 'issueCategory', render: (val) => {
      const cat = categories.find(c => c.id === val)
      return cat ? cat.name : val
    }},
    { header: 'Issue Type', accessor: 'issueType', render: (val) => {
      for (let cat of categories) {
        const sub = cat.subCategories?.find(s => s.id === val)
        if (sub) return sub.name
      }
      return val
    }},
    { header: 'Issue Details', accessor: 'issueDetails' },
    { header: 'Assigned Dept', accessor: 'assignedDept' },
    { header: 'Assigned To', accessor: 'assignedTo' },
    { header: 'Submitted By', accessor: 'submittedBy' },
    { 
      header: 'Ticket Status', 
      accessor: 'ticketStatus',
      render: (val, row) => (
        <select 
          value={val}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className={`${styles.statusSelect} ${styles[val.toLowerCase().replace(' ', '')]}`}
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
      )
    },
    { header: 'Ticket Details', accessor: 'ticketDetails' },
    { header: 'Forwarded To Dept', accessor: 'forwardedToDept' },
    { header: 'Resolve Remarks', accessor: 'resolveRemarks' },
    { header: 'Complaint Status', accessor: 'complaintStatus' },
    { header: 'Resolved Date', accessor: 'resolvedDate', render: (val) => formatDate(val) },
    { header: 'Resolved In Days', accessor: 'resolvedInDays' },
    { header: 'Pending Days', accessor: 'pendingDays' },
    { header: 'Resolved %', accessor: 'resolvedPercent', render: (val) => `${val}%` }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Complaint Board</h1>
          <p>Manage and track all complaints</p>
        </div>
        <button 
          className={styles.addBtn}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
          Add Complaint
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{complaints.length}</span>
          <span className={styles.statLabel}>Total Tickets</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {complaints.filter(c => c.ticketStatus === 'Open').length}
          </span>
          <span className={styles.statLabel}>Open</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {complaints.filter(c => c.ticketStatus === 'In Progress').length}
          </span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {complaints.filter(c => c.ticketStatus === 'Closed').length}
          </span>
          <span className={styles.statLabel}>Closed</span>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={complaints}
        rowsPerPage={10}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Complaint"
        size="large"
      >
        <TicketForm
          opsData={opsData}
          categories={categories}
          onSubmit={handleAddComplaint}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default ComplaintBoard