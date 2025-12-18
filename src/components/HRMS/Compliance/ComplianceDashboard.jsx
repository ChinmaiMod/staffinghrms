import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import './ComplianceDashboard.css'

/**
 * Compliance Dashboard - Overview of all compliance items
 * Tracks document expiry, visa renewals, I-9 reverifications, and compliance alerts
 */
function ComplianceDashboard() {
  const { tenant, selectedBusiness } = useTenant()
  const [loading, setLoading] = useState(true)
  const [complianceData, setComplianceData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('all') // all, critical, overdue, upcoming

  useEffect(() => {
    fetchComplianceData()
  }, [selectedBusiness])

  const fetchComplianceData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .rpc('get_compliance_dashboard_data', {
      //     p_tenant_id: tenant?.id,
      //     p_business_id: selectedBusiness?.id || null
      //   })
      
      // Mock data for development
      setComplianceData({
        summary: {
          total: 45,
          overdue: 5,
          dueThisWeek: 8,
          dueThisMonth: 12,
          onTrack: 20
        },
        byType: {
          documentExpiry: 18,
          visaRenewal: 8,
          i9Reverification: 6,
          backgroundCheck: 7,
          other: 6
        },
        criticalItems: [
          {
            id: 1,
            employee: 'John Smith',
            employeeId: 'emp-001',
            type: 'H1B Visa Expiry',
            dueDate: '2024-12-20',
            status: 'overdue',
            daysOverdue: 3
          },
          {
            id: 2,
            employee: 'Mary Chen',
            employeeId: 'emp-002',
            type: 'I-9 Reverification',
            dueDate: '2024-12-22',
            status: 'critical',
            daysUntilDue: 4
          }
        ]
      })
    } catch (err) {
      console.error('Error fetching compliance data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading compliance data..." />
  }

  if (error) {
    return (
      <div className="compliance-error">
        <h2>Error Loading Compliance Data</h2>
        <p>{error}</p>
        <button onClick={fetchComplianceData} className="btn-primary">Retry</button>
      </div>
    )
  }

  const { summary, byType, criticalItems } = complianceData

  return (
    <div className="compliance-dashboard-container">
      {/* Page Header */}
      <div className="compliance-header">
        <div>
          <h1 className="page-title">Compliance Dashboard</h1>
          <p className="page-subtitle">Monitor all compliance items and upcoming deadlines</p>
        </div>
        <div className="compliance-actions">
          <button className="btn-secondary">
            <DocumentTextIcon className="icon-sm" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="compliance-summary-grid">
        <ComplianceSummaryCard
          icon={ExclamationTriangleIcon}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          value={summary.overdue}
          label="Overdue"
          trend="critical"
        />
        <ComplianceSummaryCard
          icon={ClockIcon}
          iconBg="#FEF3C7"
          iconColor="#D97706"
          value={summary.dueThisWeek}
          label="Due This Week"
          trend="warning"
        />
        <ComplianceSummaryCard
          icon={ClockIcon}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
          value={summary.dueThisMonth}
          label="Due This Month"
          trend="info"
        />
        <ComplianceSummaryCard
          icon={CheckCircleIcon}
          iconBg="#D1FAE5"
          iconColor="#059669"
          value={summary.onTrack}
          label="On Track"
          trend="success"
        />
      </div>

      {/* Filter Tabs */}
      <div className="compliance-filters">
        <button
          className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          All Items ({summary.total})
        </button>
        <button
          className={`filter-tab ${selectedFilter === 'critical' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('critical')}
        >
          Critical ({summary.overdue + summary.dueThisWeek})
        </button>
        <button
          className={`filter-tab ${selectedFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('overdue')}
        >
          Overdue ({summary.overdue})
        </button>
        <button
          className={`filter-tab ${selectedFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('upcoming')}
        >
          Upcoming ({summary.dueThisMonth})
        </button>
      </div>

      {/* Content Grid */}
      <div className="compliance-content-grid">
        {/* Critical Items */}
        <div className="compliance-card">
          <div className="card-header">
            <h3>Critical Items Requiring Immediate Attention</h3>
          </div>
          <div className="critical-items-list">
            {criticalItems.length === 0 ? (
              <div className="empty-state-small">
                <CheckCircleIcon className="icon-lg" style={{ color: '#10B981' }} />
                <p>No critical items at this time</p>
              </div>
            ) : (
              criticalItems.map(item => (
                <div key={item.id} className="critical-item">
                  <div className="item-status">
                    <span className={`status-dot ${item.status}`}></span>
                  </div>
                  <div className="item-content">
                    <div className="item-header">
                      <Link to={`/hrms/employees/${item.employeeId}`} className="item-employee">
                        {item.employee}
                      </Link>
                      <span className={`urgency-badge ${item.status}`}>
                        {item.status === 'overdue' ? `${item.daysOverdue}d overdue` : `${item.daysUntilDue}d left`}
                      </span>
                    </div>
                    <div className="item-details">
                      <span className="item-type">{item.type}</span>
                      <span className="item-separator">•</span>
                      <span className="item-date">Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn-icon-sm">
                    <DocumentTextIcon className="icon-sm" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By Type Breakdown */}
        <div className="compliance-card">
          <div className="card-header">
            <h3>Compliance Items by Type</h3>
          </div>
          <div className="type-breakdown-list">
            <TypeBreakdownItem
              label="Document Expiry"
              count={byType.documentExpiry}
              color="#3B82F6"
            />
            <TypeBreakdownItem
              label="Visa Renewal"
              count={byType.visaRenewal}
              color="#8B5CF6"
            />
            <TypeBreakdownItem
              label="I-9 Reverification"
              count={byType.i9Reverification}
              color="#10B981"
            />
            <TypeBreakdownItem
              label="Background Check"
              count={byType.backgroundCheck}
              color="#F59E0B"
            />
            <TypeBreakdownItem
              label="Other"
              count={byType.other}
              color="#6B7280"
            />
          </div>
        </div>
      </div>

      {/* Placeholder for full list */}
      <div className="compliance-card">
        <div className="card-header">
          <h3>All Compliance Items</h3>
          <button className="btn-ghost">View All →</button>
        </div>
        <div className="placeholder-content">
          <p className="placeholder-text">Full compliance items table will be implemented</p>
        </div>
      </div>
    </div>
  )
}

// Summary Card Component
function ComplianceSummaryCard({ icon: Icon, iconBg, iconColor, value, label, trend }) {
  return (
    <div className="compliance-summary-card">
      <div className="card-icon" style={{ backgroundColor: iconBg }}>
        <Icon style={{ color: iconColor }} />
      </div>
      <div className="card-content">
        <div className="card-value">{value}</div>
        <div className="card-label">{label}</div>
      </div>
    </div>
  )
}

// Type Breakdown Item
function TypeBreakdownItem({ label, count, color }) {
  return (
    <div className="type-breakdown-item">
      <div className="type-info">
        <div className="type-indicator" style={{ backgroundColor: color }}></div>
        <span className="type-label">{label}</span>
      </div>
      <span className="type-count">{count}</span>
    </div>
  )
}

export default ComplianceDashboard
