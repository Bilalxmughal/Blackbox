import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Users,
  Bus
} from 'lucide-react'
import styles from './Dashboard.module.css'

function Dashboard() {
  const [stats, setStats] = useState({
    totalComplaints: 0,
    openTickets: 0,
    resolvedToday: 0,
    pendingTickets: 0,
    totalVehicles: 0,
    totalCaptains: 0
  })

  useEffect(() => {
    // Load from localStorage or set default
    const savedStats = localStorage.getItem('dashboardStats')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    } else {
      setStats({
        totalComplaints: 156,
        openTickets: 23,
        resolvedToday: 8,
        pendingTickets: 15,
        totalVehicles: 142,
        totalCaptains: 89
      })
    }
  }, [])

  const statCards = [
    { title: 'Total Complaints', value: stats.totalComplaints, icon: AlertCircle, color: '#ff6b6b' },
    { title: 'Open Tickets', value: stats.openTickets, icon: Clock, color: '#ffd93d' },
    { title: 'Resolved Today', value: stats.resolvedToday, icon: CheckCircle, color: '#6bcf7f' },
    { title: 'Pending > 3 Days', value: stats.pendingTickets, icon: TrendingUp, color: '#ff8c42' },
    { title: 'Total Vehicles', value: stats.totalVehicles, icon: Bus, color: '#4d96ff' },
    { title: 'Total Captains', value: stats.totalCaptains, icon: Users, color: '#9b59b6' },
  ]

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      
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

      <div className={styles.dashboardGrid}>
        <div className={styles.chartSection}>
          <h3>Complaint Trends</h3>
          <div className={styles.chartPlaceholder}>
            📊 Chart Component Yahan Aayega
          </div>
        </div>
        
        <div className={styles.recentSection}>
          <h3>Recent Complaints</h3>
          <div className={styles.recentList}>
            <div className={styles.recentItem}>
              <span className={styles.ticketId}>VEH-160326-001</span>
              <p>Engine issue on Route 12</p>
              <span className={styles.statusOpen}>Open</span>
            </div>
            <div className={styles.recentItem}>
              <span className={styles.ticketId}>OPS-160326-002</span>
              <p>Late departure complaint</p>
              <span className={styles.statusProgress}>In Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard