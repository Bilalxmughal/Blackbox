import { useEffect, useState, useMemo } from 'react'
import { 
  TrendingUp, AlertCircle, CheckCircle, Clock,
  Bus, Building2, Route, DollarSign, BarChart2,
  Users, Eye, ArrowRight, Percent, Wallet
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatDateDDMMYYYY } from '../../data/complaintConfig'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'

const parseNum = (v) => {
  const n = parseFloat(String(v || '').replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}
const fmtShort = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}
const fmtFull = (n) => `PKR ${Math.round(n).toLocaleString('en-PK')}`

const COMPANY_COLORS = ['#4d96ff','#9b59b6','#00d4ff','#ff8c42','#6bcf7f','#ff6b6b','#ffd93d','#e91e8c']

function Dashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [opsData, setOpsData]       = useState([])

  useEffect(() => {
    const sc = localStorage.getItem('complaints')
    const so = localStorage.getItem('buscaroOpsData')
    if (sc) setComplaints(JSON.parse(sc))
    if (so) setOpsData(JSON.parse(so))
  }, [])

  const analytics = useMemo(() => {
    const totalRecords    = opsData.length
    const uniqueCompanies = [...new Set(opsData.map(r => r['Company']).filter(Boolean))]
    const companyCount    = uniqueCompanies.length

    // per-company breakdown
    const companyData = {}
    uniqueCompanies.forEach(company => {
      const rows    = opsData.filter(r => r['Company'] === company)
      const routes  = [...new Set(rows.map(r => r['Route Name']).filter(Boolean))]
      const buses   = [...new Set(rows.map(r => r['Bus Number']).filter(Boolean))]
      const vendors = [...new Set(rows.map(r => r['Vendor Name']).filter(Boolean))]
      const rent    = rows.reduce((s, r) => s + parseNum(r['Rent']), 0)
      const gmv     = rows.reduce((s, r) => s + parseNum(r['GMV']),  0)
      companyData[company] = { routes: routes.length, buses: buses.length, vendors: vendors.length, rent, gmv, profit: gmv - rent }
    })

    // financials
    const totalRent   = opsData.reduce((s, r) => s + parseNum(r['Rent']), 0)
    const totalGMV    = opsData.reduce((s, r) => s + parseNum(r['GMV']),  0)
    const totalProfit = totalGMV - totalRent
    const marginPct   = totalGMV > 0 ? (totalProfit / totalGMV) * 100 : 0
    const validMargins = opsData.map(r => parseNum(r['Margin'])).filter(v => v !== 0)
    const avgMargin   = validMargins.length ? validMargins.reduce((s, v) => s + v, 0) / validMargins.length : 0

    // complaints
    const totalComplaints   = complaints.length
    const openTickets       = complaints.filter(c => c.ticketStatus === 'Open').length
    const inProgressTickets = complaints.filter(c => c.ticketStatus === 'In Progress').length
    const closedTickets     = complaints.filter(c => c.ticketStatus === 'Closed').length

    // user-wise
    const userMap = {}
    complaints.forEach(c => {
      const name = c.assignedTo || 'Unassigned'
      if (!userMap[name]) userMap[name] = { open: 0, inProgress: 0, closed: 0, total: 0 }
      userMap[name].total++
      if (c.ticketStatus === 'Open')        userMap[name].open++
      if (c.ticketStatus === 'In Progress') userMap[name].inProgress++
      if (c.ticketStatus === 'Closed')      userMap[name].closed++
    })
    const userStats = Object.entries(userMap)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.total - a.total)

    return {
      totalRecords, companyCount, companyData,
      totalRent, totalGMV, totalProfit, marginPct, avgMargin,
      totalComplaints, openTickets, inProgressTickets, closedTickets,
      userStats
    }
  }, [opsData, complaints])

  const recentComplaints = useMemo(() =>
    [...complaints].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
  , [complaints])

  const statCards = [
    { title: 'Total Records', value: analytics.totalRecords,      icon: Bus,         color: '#4d96ff' },
    { title: 'Companies',     value: analytics.companyCount,      icon: Building2,   color: '#9b59b6' },
    { title: 'Total Tickets', value: analytics.totalComplaints,   icon: AlertCircle, color: '#ff6b6b' },
    { title: 'Open Tickets',  value: analytics.openTickets,       icon: Clock,       color: '#ffd93d' },
    { title: 'In Progress',   value: analytics.inProgressTickets, icon: TrendingUp,  color: '#ff8c42' },
    { title: 'Resolved',      value: analytics.closedTickets,     icon: CheckCircle, color: '#6bcf7f' },
  ]

  const financeCards = [
    {
      label: 'Total Rent',   icon: DollarSign,
      short: fmtShort(analytics.totalRent),
      full:  fmtFull(analytics.totalRent),
      sub:   `${opsData.length} records`,
      color: '#4d96ff',
    },
    {
      label: 'Total GMV',    icon: BarChart2,
      short: fmtShort(analytics.totalGMV),
      full:  fmtFull(analytics.totalGMV),
      sub:   'Gross Merchandise Value',
      color: '#6bcf7f',
    },
    {
      label: 'Total Profit', icon: Wallet,
      short: fmtShort(analytics.totalProfit),
      full:  fmtFull(analytics.totalProfit),
      sub:   'GMV − Rent',
      color: analytics.totalProfit >= 0 ? '#00d4ff' : '#ff6b6b',
    },
    {
      label: 'Margin %',     icon: Percent,
      short: `${analytics.marginPct.toFixed(1)}%`,
      full:  `Avg / route: ${fmtFull(analytics.avgMargin)}`,
      sub:   'Profit ÷ GMV',
      color: analytics.marginPct >= 20 ? '#6bcf7f' : analytics.marginPct >= 10 ? '#ff8c42' : '#ff6b6b',
      isPercent: true,
    },
  ]

  const statusStyle = (s) => ({
    'Open':        { color: '#ff6b6b', bg: '#ff6b6b18' },
    'In Progress': { color: '#ff8c42', bg: '#ff8c4218' },
    'Closed':      { color: '#6bcf7f', bg: '#6bcf7f18' },
  }[s] || { color: '#aaa', bg: '#aaa18' })

  const resolveRate = analytics.totalComplaints
    ? Math.round((analytics.closedTickets / analytics.totalComplaints) * 100) : 0

  return (
    <div className={styles.dashboard}>

      {/* Welcome */}
      <div className={styles.welcome}>
        <div>
          <h1>Welcome, {currentUser?.name || 'Admin'} 👋</h1>
          <p>{currentUser?.department} Department</p>
        </div>
        {analytics.totalComplaints > 0 && (
          <div className={styles.resolveRateBadge}>
            <span className={styles.rateNum}>{resolveRate}%</span>
            <span className={styles.rateLabel}>Resolve Rate</span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={styles.statCard} style={{ borderTopColor: card.color }}>
              <div className={styles.cardIcon} style={{ background: card.color + '20', color: card.color }}>
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

      {/* Financial Summary */}
      {opsData.length > 0 && (
        <div className={styles.financeSection}>
          <h2 className={styles.sectionTitle}><BarChart2 size={18} /> Financial Summary</h2>
          <div className={styles.financeGrid}>
            {financeCards.map((card, i) => {
              const Icon = card.icon
              return (
                <div key={i} className={styles.financeCard} style={{ '--accent': card.color }}>
                  <div className={styles.financeHeader}>
                    <div className={styles.financeIconWrap} style={{ background: card.color + '18', color: card.color }}>
                      <Icon size={18} />
                    </div>
                    <span className={styles.financeLabel}>{card.label}</span>
                  </div>
                  <div className={styles.financeShort} style={{ color: card.color }}>
                    {card.isPercent ? '' : 'PKR '}{card.short}
                  </div>
                  <div className={styles.financeFull}>{card.full}</div>
                  <div className={styles.financeSub}>{card.sub}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Company Analysis */}
      {analytics.companyCount > 0 && (
        <div className={styles.analyticsSection}>
          <h2 className={styles.sectionTitle}><Building2 size={18} /> Company Analysis</h2>
          <div className={styles.companyGrid}>
            {Object.entries(analytics.companyData).map(([company, data], idx) => {
              const color  = COMPANY_COLORS[idx % COMPANY_COLORS.length]
              const gmvPct = analytics.totalGMV > 0 ? Math.round((data.gmv / analytics.totalGMV) * 100) : 0
              return (
                <div key={company} className={styles.companyCard}>
                  {/* top accent bar */}
                  <div className={styles.companyAccentBar} style={{ background: color }} />

                  <div className={styles.companyCardBody}>
                    {/* header */}
                    <div className={styles.companyCardHeader}>
                      <div className={styles.companyIconCircle} style={{ background: color + '20', color }}>
                        <Building2 size={16} />
                      </div>
                      <div>
                        <h4 className={styles.companyName}>{company}</h4>
                        <span className={styles.companyGmvPct} style={{ color }}>{gmvPct}% of Total GMV</span>
                      </div>
                    </div>

                    {/* stats row */}
                    <div className={styles.companyStats}>
                      <div className={styles.companyStat}>
                        <span className={styles.companyStatVal}>{data.routes}</span>
                        <span className={styles.companyStatLbl}>Routes</span>
                      </div>
                      <div className={styles.companyStatDivider} />
                      <div className={styles.companyStat}>
                        <span className={styles.companyStatVal}>{data.buses}</span>
                        <span className={styles.companyStatLbl}>Buses</span>
                      </div>
                      <div className={styles.companyStatDivider} />
                      <div className={styles.companyStat}>
                        <span className={styles.companyStatVal}>{data.vendors}</span>
                        <span className={styles.companyStatLbl}>Vendors</span>
                      </div>
                    </div>

                    {/* finance row */}
                    <div className={styles.companyFinance}>
                      <div className={styles.companyFinItem}>
                        <span className={styles.companyFinLbl}>Rent</span>
                        <span className={styles.companyFinVal}>PKR {fmtShort(data.rent)}</span>
                      </div>
                      <div className={styles.companyFinItem}>
                        <span className={styles.companyFinLbl}>GMV</span>
                        <span className={styles.companyFinVal} style={{ color: '#6bcf7f' }}>PKR {fmtShort(data.gmv)}</span>
                      </div>
                      <div className={styles.companyFinItem}>
                        <span className={styles.companyFinLbl}>Profit</span>
                        <span className={styles.companyFinVal} style={{ color: data.profit >= 0 ? '#00d4ff' : '#ff6b6b' }}>
                          PKR {fmtShort(data.profit)}
                        </span>
                      </div>
                    </div>

                    {/* GMV share bar */}
                    <div className={styles.companyBarWrap}>
                      <div className={styles.companyBarTrack}>
                        <div className={styles.companyBarFill} style={{ width: `${gmvPct}%`, background: color }} />
                      </div>
                      <span className={styles.companyBarPct} style={{ color }}>{gmvPct}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className={styles.dashboardGrid}>

        {/* Recent Activity */}
        <div className={styles.tableSection}>
          <div className={styles.tableSectionHeader}>
            <h3>Recent Activity</h3>
            <button className={styles.viewAllBtn} onClick={() => navigate('/complaints')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          {recentComplaints.length === 0 ? (
            <div className={styles.emptyTable}>No complaints yet</div>
          ) : (
            <div className={styles.miniTableWrap}>
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Ticket</th><th>Route / Vendor</th><th>Category</th>
                    <th>Assigned To</th><th>Date</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map(comp => {
                    const st = statusStyle(comp.ticketStatus)
                    return (
                      <tr key={comp.id} onClick={() => navigate(`/complaints/${comp.id}`)} className={styles.clickableRow}>
                        <td><span className={styles.ticketNo}>{comp.ticketNo}</span></td>
                        <td className={styles.routeCell}>{comp.routeName || comp.vendorName || '—'}</td>
                        <td>{comp.issueCategoryName || comp.issueCategory || '—'}</td>
                        <td>{comp.assignedTo || '—'}</td>
                        <td className={styles.dateCell}>{formatDateDDMMYYYY(comp.date)}</td>
                        <td><span className={styles.statusPill} style={{ color: st.color, background: st.bg }}>{comp.ticketStatus}</span></td>
                        <td><Eye size={14} color="#bbb" /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User-wise */}
        <div className={styles.userSection}>
          <h3><Users size={16} /> User-wise Tickets</h3>
          {analytics.userStats.length === 0 ? (
            <div className={styles.emptyTable}>No data</div>
          ) : (
            <div className={styles.userStatsList}>
              {analytics.userStats.map((user, i) => {
                const pct = analytics.totalComplaints
                  ? Math.round((user.total / analytics.totalComplaints) * 100) : 0
                return (
                  <div key={i} className={styles.userStatRow}>
                    <div className={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
                    <div className={styles.userInfo}>
                      <div className={styles.userNameRow}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userTotal}>{user.total}</span>
                      </div>
                      <div className={styles.userBarTrack}>
                        <div className={styles.userBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <div className={styles.userBadges}>
                        <span style={{ color: '#ff6b6b' }}>{user.open} Open</span>
                        <span style={{ color: '#ff8c42' }}>{user.inProgress} In Progress</span>
                        <span style={{ color: '#6bcf7f' }}>{user.closed} Closed</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashboard