import { useEffect, useState, useMemo, useRef } from 'react'
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock,
  Bus, Building2, DollarSign, BarChart2,
  Users, Eye, ArrowRight, Percent, Wallet,
  Bell, Search, X, ChevronDown, ChevronUp, Calendar
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

const COMPANY_COLORS = ['#f97316','#1e3a5f','#7c3aed','#16a34a','#0891b2','#dc2626','#d97706','#059669']

// Simple Donut Chart (pure SVG, no library)
function DonutChart({ open, inProgress, closed }) {
  const total = open + inProgress + closed
  if (total === 0) return null

  const segments = [
    { value: open,       color: '#f59e0b', label: 'Open' },
    { value: inProgress, color: '#f97316', label: 'In Progress' },
    { value: closed,     color: '#16a34a', label: 'Resolved' },
  ]

  const cx = 60, cy = 60, r = 48, stroke = 18
  const circumference = 2 * Math.PI * r
  let cumulativePct = 0

  return (
    <div className={styles.donutWrap}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const pct = seg.value / total
          const dash = pct * circumference
          const gap  = circumference - dash
          const offset = circumference * (0.25 - cumulativePct)
          cumulativePct += pct
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          )
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#94a3b8">TICKETS</text>
      </svg>
      <div className={styles.donutLegend}>
        {segments.map((seg, i) => (
          <div key={i} className={styles.donutLegendItem}>
            <span className={styles.donutDot} style={{ background: seg.color }} />
            <span className={styles.donutLbl}>{seg.label}</span>
            <span className={styles.donutVal}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Dashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [opsData, setOpsData]       = useState([])

  // UI states
  const [searchQuery, setSearchQuery]         = useState('')
  const [showSearch, setShowSearch]           = useState(false)
  const [showNotif, setShowNotif]             = useState(false)
  const [dateFilter, setDateFilter]           = useState('all') // 'all' | 'thisMonth' | 'lastMonth' | 'thisWeek'
  const [expandedCompany, setExpandedCompany] = useState(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const sc = localStorage.getItem('complaints')
    const so = localStorage.getItem('buscaroOpsData')
    if (sc) setComplaints(JSON.parse(sc))
    if (so) setOpsData(JSON.parse(so))
  }, [])

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Notifications from localStorage
  const notifications = useMemo(() => {
    const saved = localStorage.getItem('notifications')
    if (!saved) return []
    try {
      const all = JSON.parse(saved)
      return all.filter(n => n.userId === currentUser?.id).slice(0, 8)
    } catch { return [] }
  }, [currentUser])
  const unreadCount = notifications.filter(n => !n.read).length

  // Date filter helper
  const isInRange = (dateStr) => {
    if (dateFilter === 'all') return true
    const d = new Date(dateStr)
    const now = new Date()
    if (dateFilter === 'thisWeek') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
      return d >= weekAgo
    }
    if (dateFilter === 'thisMonth') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    if (dateFilter === 'lastMonth') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
    }
    return true
  }

  // Filtered complaints by date
  const filteredComplaints = useMemo(() =>
    complaints.filter(c => isInRange(c.date))
  , [complaints, dateFilter])

  const analytics = useMemo(() => {
    const totalRecords    = opsData.length
    const uniqueCompanies = [...new Set(opsData.map(r => r['Company']).filter(Boolean))]
    const companyCount    = uniqueCompanies.length

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

    const totalRent    = opsData.reduce((s, r) => s + parseNum(r['Rent']), 0)
    const totalGMV     = opsData.reduce((s, r) => s + parseNum(r['GMV']),  0)
    const totalProfit  = totalGMV - totalRent
    const marginPct    = totalGMV > 0 ? (totalProfit / totalGMV) * 100 : 0
    const validMargins = opsData.map(r => parseNum(r['Margin'])).filter(v => v !== 0)
    const avgMargin    = validMargins.length ? validMargins.reduce((s, v) => s + v, 0) / validMargins.length : 0

    const totalComplaints   = filteredComplaints.length
    const openTickets       = filteredComplaints.filter(c => c.ticketStatus === 'Open').length
    const inProgressTickets = filteredComplaints.filter(c => c.ticketStatus === 'In Progress').length
    const closedTickets     = filteredComplaints.filter(c => c.ticketStatus === 'Closed').length

    // Trend: compare current vs previous same period
    const now = new Date()
    const prevFilter = (dateStr) => {
      const d = new Date(dateStr)
      if (dateFilter === 'thisMonth') {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
      }
      if (dateFilter === 'thisWeek') {
        const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)
        const weekAgo     = new Date(now); weekAgo.setDate(now.getDate() - 7)
        return d >= twoWeeksAgo && d < weekAgo
      }
      return false
    }
    const prevComplaints = complaints.filter(c => prevFilter(c.date))
    const prevOpen   = prevComplaints.filter(c => c.ticketStatus === 'Open').length
    const prevClosed = prevComplaints.filter(c => c.ticketStatus === 'Closed').length
    const prevTotal  = prevComplaints.length

    const getTrend = (curr, prev) => {
      if (prev === 0) return null
      const pct = Math.round(((curr - prev) / prev) * 100)
      return pct
    }

    const userMap = {}
    filteredComplaints.forEach(c => {
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
      userStats,
      trends: {
        total:  getTrend(totalComplaints, prevTotal),
        open:   getTrend(openTickets, prevOpen),
        closed: getTrend(closedTickets, prevClosed),
      }
    }
  }, [opsData, filteredComplaints, complaints, dateFilter])

  const recentComplaints = useMemo(() => {
    let list = [...filteredComplaints].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(c =>
        (c.ticketNo || '').toLowerCase().includes(q) ||
        (c.routeName || '').toLowerCase().includes(q) ||
        (c.vendorName || '').toLowerCase().includes(q) ||
        (c.assignedTo || '').toLowerCase().includes(q) ||
        (c.issueCategoryName || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [filteredComplaints, searchQuery])

  const resolveRate = analytics.totalComplaints
    ? Math.round((analytics.closedTickets / analytics.totalComplaints) * 100) : 0

  const TrendBadge = ({ value }) => {
    if (value === null || value === undefined) return null
    const up = value > 0
    return (
      <span className={`${styles.trendBadge} ${up ? styles.trendUp : styles.trendDown}`}>
        {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {Math.abs(value)}%
      </span>
    )
  }

  const statusStyle = (s) => ({
    'Open':        { color: '#d97706', bg: '#fef3c7' },
    'In Progress': { color: '#c2410c', bg: '#fed7aa' },
    'Closed':      { color: '#065f46', bg: '#d1fae5' },
  }[s] || { color: '#94a3b8', bg: '#f1f5f9' })

  const DATE_OPTIONS = [
    { value: 'all',       label: 'All Time' },
    { value: 'thisWeek',  label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
  ]

  return (
    <div className={styles.dashboard}>

      {/* ── TOPBAR ── */}
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>
            Welcome back, <strong>{currentUser?.name || 'Admin'}</strong> — {currentUser?.department} Department
          </p>
        </div>

        <div className={styles.topbarActions}>
          {/* Global Search */}
          <div className={`${styles.searchWrap} ${showSearch ? styles.searchOpen : ''}`}>
            {showSearch && (
              <input
                autoFocus
                className={styles.searchInput}
                placeholder="Search tickets, routes, vendors..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            )}
            <button
              className={styles.iconBtn}
              onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery('') }}
            >
              {showSearch ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>

          {/* Notification Bell */}
          <div className={styles.notifWrap} ref={notifRef}>
            <button className={styles.iconBtn} onClick={() => setShowNotif(!showNotif)}>
              <Bell size={18} />
              {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
            </button>
            {showNotif && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className={styles.notifCount}>{unreadCount} new</span>}
                </div>
                {notifications.length === 0 ? (
                  <div className={styles.notifEmpty}>No notifications yet</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                      onClick={() => navigate(`/complaints/${n.ticketId}`)}
                    >
                      <div className={styles.notifMsg}>{n.message}</div>
                      <div className={styles.notifTime}>{formatDateDDMMYYYY(n.timestamp)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Resolve Rate Badge */}
          {analytics.totalComplaints > 0 && (
            <div className={styles.resolveRateBadge}>
              <span className={styles.rateNum}>{resolveRate}%</span>
              <span className={styles.rateLabel}>Resolve Rate</span>
            </div>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className={styles.statsGrid}>
        {[
          { title: 'Total Records',  value: analytics.totalRecords,      icon: Bus,          color: '#f97316', trend: null },
          { title: 'Companies',      value: analytics.companyCount,       icon: Building2,    color: '#1e3a5f', trend: null },
          { title: 'Total Tickets',  value: analytics.totalComplaints,    icon: AlertCircle,  color: '#f97316', trend: analytics.trends.total },
          { title: 'Open Tickets',   value: analytics.openTickets,        icon: Clock,        color: '#d97706', trend: analytics.trends.open },
          { title: 'In Progress',    value: analytics.inProgressTickets,  icon: TrendingUp,   color: '#ea580c', trend: null },
          { title: 'Resolved',       value: analytics.closedTickets,      icon: CheckCircle,  color: '#16a34a', trend: analytics.trends.closed },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className={styles.statCard}>
              <div className={styles.statCardTop}>
                <div className={styles.cardIcon} style={{ background: card.color + '15', color: card.color }}>
                  <Icon size={20} />
                </div>
                <TrendBadge value={card.trend} />
              </div>
              <div className={styles.statNum} style={{ color: card.color }}>{card.value}</div>
              <div className={styles.statLabel}>{card.title}</div>
            </div>
          )
        })}
      </div>

      {/* ── FINANCIAL SUMMARY ── */}
      {opsData.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <BarChart2 size={16} color="#f97316" />
              <h2 className={styles.sectionTitle}>Financial Summary</h2>
            </div>
            {/* Date Range Filter */}
            <div className={styles.dateFilterWrap}>
              <Calendar size={14} color="#94a3b8" />
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.dateFilterBtn} ${dateFilter === opt.value ? styles.dateFilterActive : ''}`}
                  onClick={() => setDateFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.financeGrid}>
            {[
              { label: 'Total Rent',   icon: DollarSign, val: fmtShort(analytics.totalRent),   full: fmtFull(analytics.totalRent),   sub: `${opsData.length} records`,       color: '#f97316', bg: '#fff4ed' },
              { label: 'Total GMV',    icon: BarChart2,  val: fmtShort(analytics.totalGMV),    full: fmtFull(analytics.totalGMV),    sub: 'Gross Merchandise Value',          color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Total Profit', icon: Wallet,     val: fmtShort(analytics.totalProfit),  full: fmtFull(analytics.totalProfit), sub: 'GMV − Rent',                      color: analytics.totalProfit >= 0 ? '#0891b2' : '#dc2626', bg: analytics.totalProfit >= 0 ? '#ecfeff' : '#fef2f2' },
              { label: 'Margin %',     icon: Percent,    val: `${analytics.marginPct.toFixed(1)}%`, full: `Avg/route: ${fmtFull(analytics.avgMargin)}`, sub: 'Profit ÷ GMV', color: analytics.marginPct >= 20 ? '#16a34a' : analytics.marginPct >= 10 ? '#d97706' : '#dc2626', bg: '#f8fafc', isPercent: true },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div key={i} className={styles.financeCard} style={{ borderTopColor: card.color }}>
                  <div className={styles.financeHeader}>
                    <div className={styles.financeIconWrap} style={{ background: card.bg, color: card.color }}>
                      <Icon size={16} />
                    </div>
                    <span className={styles.financeLabel}>{card.label}</span>
                  </div>
                  <div className={styles.financeShort} style={{ color: card.color }}>
                    {card.isPercent ? '' : 'PKR '}{card.val}
                  </div>
                  <div className={styles.financeFull}>{card.full}</div>
                  <div className={styles.financeSub}>{card.sub}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TICKET OVERVIEW (Donut + Progress) ── */}
      {analytics.totalComplaints > 0 && (
        <div className={styles.ticketOverviewRow}>
          <div className={`${styles.sectionCard} ${styles.donutSection}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <AlertCircle size={16} color="#f97316" />
                <h2 className={styles.sectionTitle}>Ticket Breakdown</h2>
              </div>
            </div>
            <DonutChart
              open={analytics.openTickets}
              inProgress={analytics.inProgressTickets}
              closed={analytics.closedTickets}
            />
          </div>

          {/* User-wise inside overview row */}
          <div className={`${styles.sectionCard} ${styles.userOverviewSection}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <Users size={16} color="#f97316" />
                <h2 className={styles.sectionTitle}>User-wise Tickets</h2>
              </div>
            </div>
            <div className={styles.userStatsList}>
              {analytics.userStats.length === 0 ? (
                <div className={styles.emptyState}>No data</div>
              ) : analytics.userStats.map((user, i) => {
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
                        <span style={{ color: '#d97706' }}>{user.open} Open</span>
                        <span style={{ color: '#ea580c' }}>{user.inProgress} IP</span>
                        <span style={{ color: '#16a34a' }}>{user.closed} Closed</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPANY ANALYSIS ── */}
      {analytics.companyCount > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <Building2 size={16} color="#f97316" />
              <h2 className={styles.sectionTitle}>Company Analysis</h2>
            </div>
            <span className={styles.sectionMeta}>{analytics.companyCount} active companies</span>
          </div>
          <div className={styles.companyGrid}>
            {Object.entries(analytics.companyData).map(([company, data], idx) => {
              const color  = COMPANY_COLORS[idx % COMPANY_COLORS.length]
              const gmvPct = analytics.totalGMV > 0 ? Math.round((data.gmv / analytics.totalGMV) * 100) : 0
              const isExpanded = expandedCompany === company

              return (
                <div key={company} className={styles.companyCard}>
                  <div className={styles.companyAccentBar} style={{ background: color }} />
                  <div className={styles.companyCardBody}>
                    <div className={styles.companyCardHeader}>
                      <div className={styles.companyIconCircle} style={{ background: color + '18', color }}>
                        <Building2 size={15} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 className={styles.companyName}>{company}</h4>
                        <span className={styles.companyGmvPct} style={{ color }}>{gmvPct}% of GMV</span>
                      </div>
                      <button
                        className={styles.expandBtn}
                        onClick={() => setExpandedCompany(isExpanded ? null : company)}
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>

                    <div className={styles.companyStats}>
                      {[
                        { val: data.routes,  lbl: 'Routes' },
                        { val: data.buses,   lbl: 'Buses' },
                        { val: data.vendors, lbl: 'Vendors' },
                      ].map((s, i) => (
                        <div key={i} className={styles.companyStat}>
                          <span className={styles.companyStatVal}>{s.val}</span>
                          <span className={styles.companyStatLbl}>{s.lbl}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.companyFinance}>
                      <div className={styles.companyFinItem}>
                        <span className={styles.companyFinLbl}>Rent</span>
                        <span className={styles.companyFinVal}>PKR {fmtShort(data.rent)}</span>
                      </div>
                      <div className={styles.companyFinItem}>
                        <span className={styles.companyFinLbl}>GMV</span>
                        <span className={styles.companyFinVal} style={{ color: '#16a34a' }}>PKR {fmtShort(data.gmv)}</span>
                      </div>
                      <div className={styles.companyFinItem}>
                        <span className={styles.companyFinLbl}>Profit</span>
                        <span className={styles.companyFinVal} style={{ color: data.profit >= 0 ? '#0891b2' : '#dc2626' }}>
                          PKR {fmtShort(data.profit)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.companyBarWrap}>
                      <div className={styles.companyBarTrack}>
                        <div className={styles.companyBarFill} style={{ width: `${gmvPct}%`, background: color }} />
                      </div>
                      <span className={styles.companyBarPct} style={{ color }}>{gmvPct}%</span>
                    </div>

                    {/* Expandable detail */}
                    {isExpanded && (
                      <div className={styles.companyExpandedDetail}>
                        <div className={styles.companyDetailRow}>
                          <span>Margin</span>
                          <span style={{ color: data.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {data.gmv > 0 ? ((data.profit / data.gmv) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className={styles.companyDetailRow}>
                          <span>Avg Rent / Bus</span>
                          <span>PKR {data.buses > 0 ? fmtShort(data.rent / data.buses) : 0}</span>
                        </div>
                        <div className={styles.companyDetailRow}>
                          <span>Avg GMV / Route</span>
                          <span>PKR {data.routes > 0 ? fmtShort(data.gmv / data.routes) : 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── RECENT ACTIVITY ── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <AlertCircle size={16} color="#f97316" />
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            {searchQuery && (
              <span className={styles.searchResultLabel}>
                {recentComplaints.length} result{recentComplaints.length !== 1 ? 's' : ''} for "{searchQuery}"
              </span>
            )}
          </div>
          <button className={styles.viewAllBtn} onClick={() => navigate('/complaints')}>
            View All <ArrowRight size={13} />
          </button>
        </div>

        {recentComplaints.length === 0 ? (
          <div className={styles.emptyState}>
            {searchQuery ? `No results for "${searchQuery}"` : 'No complaints yet'}
          </div>
        ) : (
          <div className={styles.miniTableWrap}>
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Route / Vendor</th>
                  <th>Category</th>
                  <th>Assigned To</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map(comp => {
                  const st = statusStyle(comp.ticketStatus)
                  return (
                    <tr
                      key={comp.id}
                      onClick={() => navigate(`/complaints/${comp.id}`)}
                      className={styles.clickableRow}
                    >
                      <td><span className={styles.ticketNo}>{comp.ticketNo}</span></td>
                      <td className={styles.routeCell}>{comp.routeName || comp.vendorName || '—'}</td>
                      <td>{comp.issueCategoryName || comp.issueCategory || '—'}</td>
                      <td>{comp.assignedTo || '—'}</td>
                      <td className={styles.dateCell}>{formatDateDDMMYYYY(comp.date)}</td>
                      <td>
                        <span className={styles.statusPill} style={{ color: st.color, background: st.bg }}>
                          {comp.ticketStatus}
                        </span>
                      </td>
                      <td><Eye size={13} color="#cbd5e1" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

export default Dashboard