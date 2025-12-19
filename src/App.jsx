import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthProvider'
import Layout from './components/Shared/Layout/Layout'
import Dashboard from './components/HRMS/Dashboard/Dashboard'
import EmployeeManagement from './components/HRMS/Employees/EmployeeManagement'
import ComplianceDashboard from './components/HRMS/Compliance/ComplianceDashboard'
import DataAdministration from './components/HRMS/DataAdmin/DataAdministration'
import LoginPage from './components/Auth/LoginPage'
import LoadingSpinner from './components/Shared/LoadingSpinner'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Public Route wrapper (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }
  
  if (user) {
    return <Navigate to="/hrms/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      
      {/* Protected HRMS Routes */}
      <Route path="/hrms" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees/*" element={<EmployeeManagement />} />
        <Route path="compliance" element={<ComplianceDashboard />} />
        <Route path="data-admin/*" element={<DataAdministration />} />
        {/* Additional routes will be added here */}
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/hrms/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/hrms/dashboard" replace />} />
    </Routes>
  )
}

export default App
