import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './TimesheetForm.css'

/**
 * TimesheetForm - Weekly timesheet entry form
 * URL: /hrms/timesheets/new or /hrms/timesheets/:timesheetId/edit
 */
function TimesheetForm() {
  const { timesheetId } = useParams()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return (
    <div className="timesheet-form-container">
      <div className="timesheet-form-header">
        <Link to="/hrms/timesheets" className="back-link">
          ← Back to Timesheets
        </Link>
        <h1>Timesheet Entry</h1>
      </div>
      <div className="timesheet-form-content">
        <p>Timesheet form implementation in progress...</p>
      </div>
    </div>
  )
}

export default TimesheetForm
