import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthProvider'
import { usePermissions } from './contexts/PermissionsProvider'
import Layout from './components/Shared/Layout/Layout'
import Dashboard from './components/HRMS/Dashboard/Dashboard'
import EmployeeManagement from './components/HRMS/Employees/EmployeeManagement'
import ComplianceDashboard from './components/HRMS/Compliance/ComplianceDashboard'
import DataAdministration from './components/HRMS/DataAdmin/DataAdministration'
import EmployeeTickets from './components/HRMS/Tickets/EmployeeTickets'
import TicketDetailAdmin from './components/HRMS/Tickets/TicketDetailAdmin'
import { ClientList, ClientForm, ClientDetail } from './components/HRMS/Clients'
import VendorManagement from './components/HRMS/Vendors/VendorManagement'
import ProjectManagement from './components/HRMS/Projects/ProjectManagement'
import DocumentManagement from './components/HRMS/Documents/DocumentManagement'
import TimesheetManagement from './components/HRMS/Timesheets/TimesheetManagement'
import { NotificationsList } from './components/HRMS/Notifications'
import NewsletterManagement from './components/HRMS/Newsletters/NewsletterManagement'
import SuggestionManagement from './components/HRMS/Suggestions/SuggestionManagement'
import SettingsManagement from './components/HRMS/Settings/SettingsManagement'
import { IssueList, IssueReport, IssueDetail, IssueManagement } from './components/IssueReport'
import LoginPage from './components/Auth/LoginPage'
import LoadingSpinner from './components/Shared/LoadingSpinner'
import { ToastContainer } from './components/Shared/Toast'

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

// Permission-protected route wrapper - checks menu access
function PermissionProtectedRoute({ children, path }) {
  const { hasMenuAccess, roleLevel, loading: permissionsLoading } = usePermissions()
  const location = useLocation()
  
  if (permissionsLoading) {
    return <LoadingSpinner fullScreen message="Loading permissions..." />
  }
  
  // Super admin (level 5) has access to everything
  if (roleLevel === 5) {
    return children
  }
  
  // Check if user has access to this route
  const hasAccess = hasMenuAccess(path || location.pathname)
  
  if (!hasAccess) {
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/hrms/dashboard" replace />
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

// Root redirect component - handles auth-aware redirects
function RootRedirect() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }
  
  if (user) {
    return <Navigate to="/hrms/dashboard" replace />
  }
  
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <>
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
        <Route path="dashboard" element={
          <PermissionProtectedRoute path="/hrms/dashboard">
            <Dashboard />
          </PermissionProtectedRoute>
        } />
        <Route path="employees/*" element={
          <PermissionProtectedRoute path="/hrms/employees">
            <EmployeeManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="compliance" element={
          <PermissionProtectedRoute path="/hrms/compliance">
            <ComplianceDashboard />
          </PermissionProtectedRoute>
        } />
        <Route path="tickets" element={
          <PermissionProtectedRoute path="/hrms/tickets">
            <EmployeeTickets />
          </PermissionProtectedRoute>
        } />
        <Route path="tickets/:ticketId" element={
          <PermissionProtectedRoute path="/hrms/tickets">
            <TicketDetailAdmin />
          </PermissionProtectedRoute>
        } />
        <Route path="clients" element={
          <PermissionProtectedRoute path="/hrms/clients">
            <ClientList />
          </PermissionProtectedRoute>
        } />
        <Route path="clients/new" element={
          <PermissionProtectedRoute path="/hrms/clients">
            <ClientForm />
          </PermissionProtectedRoute>
        } />
        <Route path="clients/:clientId" element={
          <PermissionProtectedRoute path="/hrms/clients">
            <ClientDetail />
          </PermissionProtectedRoute>
        } />
        <Route path="clients/:clientId/edit" element={
          <PermissionProtectedRoute path="/hrms/clients">
            <ClientForm />
          </PermissionProtectedRoute>
        } />
        <Route path="vendors/*" element={
          <PermissionProtectedRoute path="/hrms/vendors">
            <VendorManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="projects/*" element={
          <PermissionProtectedRoute path="/hrms/projects">
            <ProjectManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="documents/*" element={
          <PermissionProtectedRoute path="/hrms/documents">
            <DocumentManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="timesheets/*" element={
          <PermissionProtectedRoute path="/hrms/timesheets">
            <TimesheetManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="newsletters/*" element={
          <PermissionProtectedRoute path="/hrms/newsletter">
            <NewsletterManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="suggestions/*" element={
          <PermissionProtectedRoute path="/hrms/suggestions">
            <SuggestionManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="notifications" element={
          <PermissionProtectedRoute path="/hrms/notifications">
            <NotificationsList />
          </PermissionProtectedRoute>
        } />
        <Route path="data-admin/*" element={
          <PermissionProtectedRoute path="/hrms/data-admin">
            <DataAdministration />
          </PermissionProtectedRoute>
        } />
        <Route path="settings" element={
          <PermissionProtectedRoute path="/hrms/profile">
            <SettingsManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="profile" element={
          <PermissionProtectedRoute path="/hrms/profile">
            <SettingsManagement />
          </PermissionProtectedRoute>
        } />
        <Route path="issues" element={
          <PermissionProtectedRoute path="/hrms/issues">
            <IssueList />
          </PermissionProtectedRoute>
        } />
        <Route path="issues/new" element={
          <PermissionProtectedRoute path="/hrms/issues">
            <IssueReport />
          </PermissionProtectedRoute>
        } />
        <Route path="issues/:issueId" element={
          <PermissionProtectedRoute path="/hrms/issues">
            <IssueDetail />
          </PermissionProtectedRoute>
        } />
        <Route path="issues/admin" element={
          <PermissionProtectedRoute path="/hrms/issues">
            <IssueManagement />
          </PermissionProtectedRoute>
        } />
        {/* Additional routes will be added here */}
      </Route>
      
      {/* Default redirect - handles auth-aware redirects */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
      </Routes>
      <ToastContainer />
    </>
  )
}

export default App
