import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './TimesheetDetail.css'

/**
 * TimesheetDetail - View timesheet details (HRMS - Read-only)
 * URL: /hrms/timesheets/:timesheetId
 * Note: Editing happens in employee-portal
 */
function TimesheetDetail() {
  const { timesheetId } = useParams()
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timesheet, setTimesheet] = useState(null)
  const [entries, setEntries] = useState([])

  useEffect(() => {
    if (tenant?.tenant_id && timesheetId) {
      fetchTimesheet()
      fetchEntries()
    }
  }, [tenant?.tenant_id, timesheetId])

  const fetchTimesheet = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('hrms_timesheets')
        .select(`
          timesheet_id,
          period_start_date,
          period_end_date,
          total_hours_worked,
          regular_hours,
          overtime_hours,
          submission_status,
          submitted_at,
          approved_at,
          rejection_reason,
          employee:hrms_employees!hrms_timesheets_employee_id_fkey(
            employee_id,
            first_name,
            last_name,
            employee_code
          ),
          project:hrms_projects!hrms_timesheets_project_id_fkey(
            project_id,
            project_name
          )
        `)
        .eq('timesheet_id', timesheetId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (queryError) throw queryError
      setTimesheet(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching timesheet:', err)
      setError(err.message || 'Failed to load timesheet')
      setLoading(false)
    }
  }

  const fetchEntries = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('hrms_timesheet_entries')
        .select('*')
        .eq('timesheet_id', timesheetId)
        .order('work_date', { ascending: true })

      if (queryError) throw queryError
      setEntries(data || [])
    } catch (err) {
      console.error('Error fetching entries:', err)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // TODO: Implement PDF generation via Edge Function
      console.log('Download PDF for timesheet:', timesheetId)
      alert('PDF download functionality will be implemented via Edge Function')
    } catch (err) {
      console.error('Error downloading PDF:', err)
      alert('Failed to download PDF')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '-'
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr}-${endStr}`
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading timesheet..." />
  }

  if (error) {
    return (
      <div className="timesheet-detail-container">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchTimesheet}>Retry</button>
        </div>
      </div>
    )
  }

  if (!timesheet) {
    return (
      <div className="timesheet-detail-container">
        <div className="error-banner">
          <p>Timesheet not found</p>
          <Link to="/hrms/timesheets" className="btn btn-secondary">Back to Timesheets</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="timesheet-detail-container">
      <div className="timesheet-detail-header">
        <Link to="/hrms/timesheets" className="back-link">
          ← Back to Timesheets
        </Link>
        <div className="header-actions">
          <h1>Timesheet Details</h1>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            <ArrowDownTrayIcon className="icon-sm" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="timesheet-detail-content">
        {/* Summary */}
        <div className="timesheet-summary-card">
          <div className="summary-row">
            <div className="summary-item">
              <label>Employee</label>
              <div>
                <strong>{timesheet.employee?.first_name} {timesheet.employee?.last_name}</strong>
                <span className="employee-code"> ({timesheet.employee?.employee_code})</span>
              </div>
            </div>
            <div className="summary-item">
              <label>Project</label>
              <div><strong>{timesheet.project?.project_name || '-'}</strong></div>
            </div>
            <div className="summary-item">
              <label>Period</label>
              <div><strong>{formatDateRange(timesheet.period_start_date, timesheet.period_end_date)}</strong></div>
            </div>
            <div className="summary-item">
              <label>Status</label>
              <div>
                <span className="status-badge" style={{
                  backgroundColor: TIMESHEET_STATUSES[timesheet.submission_status]?.bg || '#F3F4F6',
                  color: TIMESHEET_STATUSES[timesheet.submission_status]?.text || '#374151',
                }}>
                  {TIMESHEET_STATUSES[timesheet.submission_status]?.label || timesheet.submission_status}
                </span>
              </div>
            </div>
          </div>
          <div className="summary-row">
            <div className="summary-item">
              <label>Total Hours</label>
              <div><strong>{timesheet.total_hours_worked} hrs</strong></div>
            </div>
            <div className="summary-item">
              <label>Regular Hours</label>
              <div><strong>{timesheet.regular_hours} hrs</strong></div>
            </div>
            <div className="summary-item">
              <label>Overtime Hours</label>
              <div><strong>{timesheet.overtime_hours || 0} hrs</strong></div>
            </div>
            <div className="summary-item">
              <label>Submitted</label>
              <div>{timesheet.submitted_at ? formatDate(timesheet.submitted_at) : '-'}</div>
            </div>
          </div>
        </div>

        {/* Daily Entries */}
        <div className="timesheet-entries-section">
          <h2>Daily Entries</h2>
          <table className="entries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours</th>
                <th>Type</th>
                <th>Task Description</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">No entries found</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.entry_id}>
                    <td>{formatDate(entry.work_date)}</td>
                    <td>{entry.hours_worked}</td>
                    <td>
                      <span className="entry-type-badge">{entry.entry_type || 'regular'}</span>
                    </td>
                    <td>{entry.task_description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Approval Info */}
        {timesheet.submission_status === 'approved' && timesheet.approved_at && (
          <div className="approval-info">
            <p><strong>Approved on:</strong> {formatDate(timesheet.approved_at)}</p>
          </div>
        )}

        {timesheet.submission_status === 'rejected' && timesheet.rejection_reason && (
          <div className="rejection-info">
            <p><strong>Rejection Reason:</strong> {timesheet.rejection_reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

const TIMESHEET_STATUSES = {
  draft: { label: 'Draft', bg: '#F3F4F6', text: '#374151' },
  submitted: { label: 'Submitted', bg: '#DBEAFE', text: '#1E40AF' },
  approved: { label: 'Approved', bg: '#D1FAE5', text: '#065F46' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B' },
}

export default TimesheetDetail
