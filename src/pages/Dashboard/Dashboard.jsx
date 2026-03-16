import { useEffect, useState, useMemo } from 'react'
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Users,
  Bus,
  Building2,
  Route
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './Dashboard.module.css'

function Dashboard() {
  const { currentUser } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [opsData, setOpsData] = useState([])

  useEffect(() => {
    const savedComplaints = localStorage.getItem('complaints')
    const savedOpsData = localStorage.getItem('buscaroOpsData')
    
    if (savedComplaints) setComplaints(JSON.parse(savedComplaints))
    if (savedOpsData) setOpsData(JSON.parse(savedOpsData))
  }, [])

  // Analytics calculations
  const analytics = useMemo(() => {
    // Total records
    const totalRecords = opsData.length
    
    // Unique companies count
    const uniqueCompanies = [...new Set(opsData.map(item => item.company).filter(Boolean))]
    const companyCount = uniqueCompanies.length
    
    // Routes per company
    const companyRoutes = {}
    uniqueCompanies.forEach(company => {
      const companyData = opsData.filter(item => item.company === company)
      const routes = [...new Set(companyData.map(item => item.routeName).filter(Boolean))]
      companyRoutes[company] = routes.length
    })

    // Complaint stats
    const totalComplaints = complaints.length
    const openTickets = complaints.filter(c => c.ticketStatus === 'Open').length
    const inProgressTickets = complaints.filter(c => c.ticketStatus === 'In Progress').length
    const closedTickets = complaints.filter(c => c.ticketStatus === 'Closed').length

    return {
      totalRecords,
      companyCount,
      companyRoutes,
      totalComplaints,
      openTickets,
      inProgressTickets,
      closedTickets
    }
  }, [opsData, complaints])

  const statCards = [
    { title: 'Total Records', value: analytics.totalRecords, icon: Bus, color: '#4d96ff' },
    { title: 'Companies', value: analytics.companyCount, icon: Building2, color: '#9b59b6' },
    { title: 'Total Complaints', value: analytics.totalComplaints, icon: AlertCircle, color: '#ff6b6b' },
    { title: 'Open Tickets', value: analytics.openTickets, icon: Clock, color: '#ffd93d' },
    { title: 'In Progress', value: analytics.inProgressTickets, icon: TrendingUp, color: '#ff8c42' },
    { title: 'Resolved', value: analytics.closedTickets, icon: CheckCircle, color: '#6bcf7f' },
  ]

  return (
    <div className={styles.dashboard}>
      <div className={styles.welcome}>
        <h1>Welcome, {currentUser?.name || 'Admin'}</h1>
        <p>{currentUser?.department} Department</p>
      </div>
      
      <div className={styles.statsGrid}>
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className={styles.statCard} style={{ borderTopColor: card.color }}>
              <div className={styles.cardIcon} style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                <Icon size={24} />
              </div>
              <div className={styles.cardInfo}>
                <h3>{card.value}</h3>
                <p>{card.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Company Routes Analytics */}
      {analytics.companyCount > 0 && (
  <div className={styles.analyticsSection}>
    <h2>Company Routes Analysis</h2>
    <div className={styles.companyGridCompact}>
      {Object.entries(analytics.companyRoutes).map(([company, routeCount]) => (
        <div key={company} className={styles.companyCardCompact}>
          <div className={styles.companyIcon}>
            <Building2 size={20} color="#00d4ff" />
          </div>
          <div className={styles.companyInfo}>
            <h4>{company}</h4>
            <p><Route size={14} /> {routeCount} Routes</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

      <div className={styles.dashboardGrid}>
        <div className={styles.chartSection}>
          <h3>Recent Activity</h3>
          <div className={styles.activityList}>
            {complaints.slice(0, 5).map(comp => (
              <div key={comp.id} className={styles.activityItem}>
                <span className={styles.ticketId}>{comp.ticketNo}</span>
                <p>{comp.issueDetails?.substring(0, 50)}...</p>
                <span className={styles[comp.ticketStatus.replace(' ', '')]}>
                  {comp.ticketStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.recentSection}>
          <h3>Quick Stats</h3>
          <div className={styles.quickStats}>
            <div className={styles.stat}>
              <span>{analytics.totalRecords}</span>
              <label>Fleet Records</label>
            </div>
            <div className={styles.stat}>
              <span>{analytics.companyCount}</span>
              <label>Companies</label>
            </div>
            <div className={styles.stat}>
              <span>{analytics.openTickets + analytics.inProgressTickets}</span>
              <label>Pending Issues</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard