import { Routes, Route } from 'react-router-dom'
import TimesheetList from './TimesheetList'
import TimesheetForm from './TimesheetForm'
import TimesheetDetail from './TimesheetDetail'
import TimesheetApproval from './TimesheetApproval'

/**
 * TimesheetManagement - Router component for timesheet management
 * Handles routing for /hrms/timesheets/*
 */
function TimesheetManagement() {
  return (
    <Routes>
      <Route index element={<TimesheetList />} />
      <Route path="new" element={<TimesheetForm />} />
      <Route path="approve" element={<TimesheetApproval />} />
      <Route path=":timesheetId" element={<TimesheetDetail />} />
      <Route path=":timesheetId/edit" element={<TimesheetForm />} />
    </Routes>
  )
}

export default TimesheetManagement
