import { Routes, Route } from 'react-router-dom'
import EmployeeList from './EmployeeList'
import EmployeeDetail from './EmployeeDetail'
import EmployeeForm from './EmployeeForm'

/**
 * Employee Management - Main routing component for employee features
 * Based on UI_DESIGN_DOCS/03_EMPLOYEE_MANAGEMENT.md
 */
function EmployeeManagement() {
  return (
    <Routes>
      <Route index element={<EmployeeList />} />
      <Route path="new" element={<EmployeeForm />} />
      <Route path=":employeeId" element={<EmployeeDetail />} />
      <Route path=":employeeId/edit" element={<EmployeeForm />} />
    </Routes>
  )
}

export default EmployeeManagement
