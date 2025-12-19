import { useEffect, useState, useMemo } from 'react'
import {
  IdentificationIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './VisaStatusOverview.css'

/**
 * VisaStatusOverview - Displays current visa status for an employee
 * Based on UI_DESIGN_DOCS/10_VISA_IMMIGRATION.md section 1.2
 */
function VisaStatusOverview({ employeeId }) {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visaStatus, setVisaStatus] = useState(null)

  useEffect(() => {
    if (tenant?.tenant_id && employeeId) {
      fetchCurrentVisaStatus()
    }
  }, [tenant?.tenant_id, employeeId])

  const fetchCurrentVisaStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id || !employeeId) {
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('hrms_visa_statuses')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .eq('employee_id', employeeId)
        .eq('is_current', true)
        .order('start_date', { ascending: false })
        .maybeSingle()

      if (fetchError) throw fetchError

      setVisaStatus(data)
    } catch (err) {
      console.error('Error fetching visa status:', err)
      setError(err.message || 'Failed to fetch visa status')
    } finally {
      setLoading(false)
    }
  }

  const visaStatusConfig = useMemo(() => {
    if (!visaStatus) return null

    const status = visaStatus.visa_status?.toLowerCase() || 'active'
    const configs = {
      active: { icon: CheckCircleIcon, color: '#10B981', bgColor: '#D1FAE5', label: 'Active' },
      pending: { icon: ClockIcon, color: '#1E40AF', bgColor: '#DBEAFE', label: 'Pending' },
      expired: { icon: XCircleIcon, color: '#991B1B', bgColor: '#FEE2E2', label: 'Expired' },
      cancelled: { icon: XCircleIcon, color: '#6B7280', bgColor: '#F3F4F6', label: 'Cancelled' },
    }

    // Check if expiring soon (≤60 days)
    if (status === 'active' && visaStatus.end_date) {
      const endDate = new Date(visaStatus.end_date)
      const today = new Date()
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
      
      if (daysRemaining <= 60 && daysRemaining > 0) {
        return {
          icon: ExclamationTriangleIcon,
          color: '#92400E',
          bgColor: '#FEF3C7',
          label: 'Expiring Soon',
        }
      }
    }

    return configs[status] || configs.active
  }, [visaStatus])

  const timeRemaining = useMemo(() => {
    if (!visaStatus?.end_date) return null

    const startDate = new Date(visaStatus.start_date)
    const endDate = new Date(visaStatus.end_date)
    const today = new Date()

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24))

    const percentage = totalDays > 0 ? Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100)) : 0

    return {
      daysRemaining: Math.max(0, daysRemaining),
      percentage,
      totalDays,
    }
  }, [visaStatus])

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getProgressColor = () => {
    if (!timeRemaining) return '#10B981'
    const { percentage } = timeRemaining
    if (percentage > 50) return '#10B981' // green
    if (percentage > 30) return '#F59E0B' // amber
    return '#EF4444' // red
  }

  if (loading) {
    return (
      <div className="visa-status-overview-loading">
        <LoadingSpinner message="Loading visa status..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="visa-status-overview-error">
        <p className="error-message">{error}</p>
      </div>
    )
  }

  if (!visaStatus) {
    return (
      <div className="visa-status-overview-empty">
        <p>No visa status found for this employee.</p>
      </div>
    )
  }

  const StatusIcon = visaStatusConfig?.icon || CheckCircleIcon

  return (
    <div className="visa-status-overview">
      <div className="visa-status-card">
        <div className="visa-status-header">
          <div className="visa-status-title">
            <IdentificationIcon className="visa-icon" />
            <h3>{visaStatus.visa_type_name || 'Visa Status'}</h3>
          </div>
          <div
            className="visa-status-badge"
            style={{
              backgroundColor: visaStatusConfig?.bgColor,
              color: visaStatusConfig?.color,
            }}
          >
            <StatusIcon className="status-icon" />
            <span>{visaStatusConfig?.label}</span>
          </div>
        </div>

        <div className="visa-status-details">
          <div className="visa-detail-row">
            <div className="visa-detail-field">
              <label>Receipt Number</label>
              <div className="visa-detail-value">
                {visaStatus.receipt_number || 'N/A'}
                {visaStatus.receipt_number && (
                  <button
                    className="copy-button"
                    onClick={() => navigator.clipboard.writeText(visaStatus.receipt_number)}
                    title="Copy receipt number"
                  >
                    📋
                  </button>
                )}
              </div>
            </div>
            <div className="visa-detail-field">
              <label>Petition Number</label>
              <div className="visa-detail-value">
                {visaStatus.petition_number || 'N/A'}
                {visaStatus.petition_number && (
                  <button
                    className="copy-button"
                    onClick={() => navigator.clipboard.writeText(visaStatus.petition_number)}
                    title="Copy petition number"
                  >
                    📋
                  </button>
                )}
              </div>
            </div>
          </div>

          {visaStatus.case_number && (
            <div className="visa-detail-row">
              <div className="visa-detail-field">
                <label>Case Number</label>
                <div className="visa-detail-value">{visaStatus.case_number}</div>
              </div>
            </div>
          )}

          <div className="visa-validity-period">
            <h4>Validity Period</h4>
            <div className="validity-dates">
              <div className="validity-date">
                <label>Start Date</label>
                <span>{formatDate(visaStatus.start_date)}</span>
              </div>
              <div className="validity-date">
                <label>Expiry Date</label>
                <span>{formatDate(visaStatus.end_date)}</span>
              </div>
            </div>

            {timeRemaining && (
              <div className="visa-progress">
                <div className="progress-info">
                  <span>
                    Time Remaining: {timeRemaining.daysRemaining} days (
                    {Math.floor(timeRemaining.daysRemaining / 365)} years)
                  </span>
                  <span>{Math.round(100 - timeRemaining.percentage)}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${100 - timeRemaining.percentage}%`,
                      backgroundColor: getProgressColor(),
                    }}
                  />
                  <div className="progress-bar-today" />
                </div>
                <div className="progress-timeline">
                  <span>{formatDate(visaStatus.start_date)}</span>
                  <span className="today-marker">Today</span>
                  <span>{formatDate(visaStatus.end_date)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisaStatusOverview
