import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthProvider'
import { useTenant } from '../../../contexts/TenantProvider'
import { 
  UsersIcon, 
  BriefcaseIcon, 
  CalendarIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './Dashboard.css'

/**
 * HRMS Dashboard - Main landing page with overview metrics and charts
 * Based on UI_DESIGN_DOCS/02_HRMS_DASHBOARD.md
 */
function Dashboard() {
  const { user, profile } = useAuth()
  const { tenant, selectedBusiness } = useTenant()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [selectedBusiness])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API calls
      // const { data, error } = await supabase.rpc('get_dashboard_stats', { 
      //   tenant_id: tenant?.id,
      //   business_id: selectedBusiness?.id 
      // })
      
      // Mock data for initial development
      const mockData = {
        totalEmployees: { count: 156, change: 8, changePercent: 5.4, period: 'month' },
        activeProjects: { count: 89, change: 3, changePercent: 3.5, period: 'week' },
        onLeave: { count: 12, returning: 4 },
        compliancePending: { count: 23, overdue: 5 },
      }
      
      setStats(mockData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Error loading dashboard: {error}</p>
        <button onClick={fetchDashboardData}>Retry</button>
      </div>
    )
  }

  const userName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-left">
          <h1 className="welcome-greeting">Welcome Back, {userName}! 👋</h1>
          <p className="welcome-subtext">Here's what's happening in your HRMS today.</p>
        </div>
        <div className="welcome-right">
          <span className="welcome-date">{today}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-stats-grid">
        <StatCard
          icon={UsersIcon}
          iconBg="#DBEAFE"
          iconColor="#3B82F6"
          value={stats.totalEmployees.count}
          label="Total Employees"
          trend={stats.totalEmployees.change}
          trendPercent={stats.totalEmployees.changePercent}
          secondary={`+${stats.totalEmployees.change} added this ${stats.totalEmployees.period}`}
        />
        
        <StatCard
          icon={BriefcaseIcon}
          iconBg="#D1FAE5"
          iconColor="#10B981"
          value={stats.activeProjects.count}
          label="Active Projects"
          trend={stats.activeProjects.change}
          trendPercent={stats.activeProjects.changePercent}
          secondary={`+${stats.activeProjects.change} this ${stats.activeProjects.period}`}
        />
        
        <StatCard
          icon={CalendarIcon}
          iconBg="#FEF3C7"
          iconColor="#F59E0B"
          value={stats.onLeave.count}
          label="On Leave"
          secondary={`${stats.onLeave.returning} returning this week`}
        />
        
        <StatCard
          icon={ExclamationTriangleIcon}
          iconBg="#FEE2E2"
          iconColor="#EF4444"
          value={stats.compliancePending.count}
          label="Compliance Pending"
          trend={stats.compliancePending.overdue > 0 ? -stats.compliancePending.overdue : 0}
          secondary={stats.compliancePending.overdue > 0 ? `⚠️ ${stats.compliancePending.overdue} overdue` : 'All on track'}
        />
      </div>

      {/* Charts Section - To be implemented */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Employees by Type</h3>
          </div>
          <div className="chart-placeholder">
            <p>Chart will be implemented with visualization library</p>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Compliance Status</h3>
          </div>
          <div className="chart-placeholder">
            <p>Chart will be implemented with visualization library</p>
          </div>
        </div>
      </div>

      {/* Expiring Documents - To be implemented */}
      <div className="dashboard-section">
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">
              <ExclamationTriangleIcon className="section-icon" />
              Expiring Documents (Next 30 Days)
            </h3>
            <Link to="/hrms/compliance" className="section-link">
              View All &rarr;
            </Link>
          </div>
          <div className="section-content">
            <p className="section-placeholder">Document list will be implemented</p>
          </div>
        </div>
      </div>

      {/* Recent Activities - To be implemented */}
      <div className="dashboard-section">
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">📋 Recent Activities</h3>
            <Link to="/hrms/activities" className="section-link">
              View All &rarr;
            </Link>
          </div>
          <div className="section-content">
            <p className="section-placeholder">Activity feed will be implemented</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Reusable stat card component
 */
function StatCard({ 
  icon: Icon, 
  iconBg, 
  iconColor, 
  value, 
  label, 
  trend, 
  trendPercent, 
  secondary 
}) {
  const hasPositiveTrend = trend && trend > 0
  const hasNegativeTrend = trend && trend < 0
  
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-icon-container" style={{ backgroundColor: iconBg }}>
          <Icon className="stat-icon" style={{ color: iconColor }} />
        </div>
        {trend !== undefined && (
          <div className={`stat-trend ${hasPositiveTrend ? 'positive' : hasNegativeTrend ? 'negative' : 'neutral'}`}>
            {hasPositiveTrend && <ArrowTrendingUpIcon className="trend-icon" />}
            {hasNegativeTrend && <ArrowTrendingDownIcon className="trend-icon" />}
            <span>
              {hasPositiveTrend && '+'}
              {trend}
              {trendPercent && ` (${trendPercent}%)`}
            </span>
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {secondary && <div className="stat-secondary">{secondary}</div>}
      </div>
    </div>
  )
}

export default Dashboard
