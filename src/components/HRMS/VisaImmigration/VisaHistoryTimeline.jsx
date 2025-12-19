import { useEffect, useState } from 'react'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './VisaHistoryTimeline.css'

/**
 * VisaHistoryTimeline - Displays visa history as a timeline
 * Based on UI_DESIGN_DOCS/10_VISA_IMMIGRATION.md section 2.1
 */
function VisaHistoryTimeline({ employeeId }) {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visaHistory, setVisaHistory] = useState([])

  useEffect(() => {
    if (tenant?.tenant_id && employeeId) {
      fetchVisaHistory()
    }
  }, [tenant?.tenant_id, employeeId])

  const fetchVisaHistory = async () => {
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
        .order('start_date', { ascending: false })

      if (fetchError) throw fetchError

      setVisaHistory(data || [])
    } catch (err) {
      console.error('Error fetching visa history:', err)
      setError(err.message || 'Failed to fetch visa history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusConfig = (status, isCurrent) => {
    if (isCurrent) {
      return { color: '#10B981', nodeType: 'filled', label: 'Current' }
    }
    
    const configs = {
      active: { color: '#3B82F6', nodeType: 'outline', label: 'Active' },
      expired: { color: '#6B7280', nodeType: 'outline', label: 'Expired' },
      pending: { color: '#3B82F6', nodeType: 'outline', label: 'Pending' },
      cancelled: { color: '#6B7280', nodeType: 'outline', label: 'Cancelled' },
    }
    
    return configs[status?.toLowerCase()] || configs.expired
  }

  if (loading) {
    return (
      <div className="visa-history-loading">
        <LoadingSpinner message="Loading visa history..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="visa-history-error">
        <p className="error-message">{error}</p>
      </div>
    )
  }

  if (visaHistory.length === 0) {
    return (
      <div className="visa-history-empty">
        <p>No visa history found for this employee.</p>
      </div>
    )
  }

  return (
    <div className="visa-history-timeline">
      <div className="timeline-container">
        {visaHistory.map((visa, index) => {
          const statusConfig = getStatusConfig(visa.visa_status, visa.is_current)
          const isLast = index === visaHistory.length - 1
          
          return (
            <div key={visa.visa_status_id} className="timeline-item">
              <div className="timeline-node-container">
                <div
                  className={`timeline-node ${statusConfig.nodeType}`}
                  style={{ borderColor: statusConfig.color }}
                >
                  {statusConfig.nodeType === 'filled' && (
                    <div
                      className="timeline-node-fill"
                      style={{ backgroundColor: statusConfig.color }}
                    />
                  )}
                </div>
                {!isLast && (
                  <div
                    className="timeline-line"
                    style={{ backgroundColor: '#D1D5DB' }}
                  />
                )}
              </div>
              
              <div className="timeline-content">
                <div className="visa-history-card">
                  <div className="visa-history-header">
                    <h4>{visa.visa_type_name || 'Visa Status'}</h4>
                    {visa.is_current && (
                      <span
                        className="visa-history-badge"
                        style={{
                          backgroundColor: statusConfig.color,
                          color: 'white',
                        }}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                  
                  <div className="visa-history-dates">
                    {formatDate(visa.start_date)} - {formatDate(visa.end_date) || 'Present'}
                  </div>
                  
                  {visa.receipt_number && (
                    <div className="visa-history-detail">
                      <span className="detail-label">Receipt:</span>
                      <span className="detail-value">{visa.receipt_number}</span>
                    </div>
                  )}
                  
                  {visa.petition_number && (
                    <div className="visa-history-detail">
                      <span className="detail-label">Petition:</span>
                      <span className="detail-value">{visa.petition_number}</span>
                    </div>
                  )}
                  
                  <div className="visa-history-status">
                    Status: <span style={{ color: statusConfig.color }}>{statusConfig.label}</span>
                    {!visa.is_current && visa.visa_status === 'expired' && (
                      <span className="status-note">
                        {visaHistory[0]?.is_current ? 'Replaced by current' : 'Expired'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VisaHistoryTimeline
