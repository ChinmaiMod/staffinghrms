import { Routes, Route } from 'react-router-dom'
import TimesheetList from './TimesheetList'
import TimesheetDetail from './TimesheetDetail'

/**
 * TimesheetManagement - Router component for timesheet management (HRMS - Read-only)
 * Handles routing for /hrms/timesheets/*
 * Note: Submission and approval happen in employee-portal, not HRMS
 */
function TimesheetManagement() {
  return (
    <Routes>
      <Route index element={<TimesheetList />} />
      <Route path=":timesheetId" element={<TimesheetDetail />} />
    </Routes>
  )
}

export default TimesheetManagement
