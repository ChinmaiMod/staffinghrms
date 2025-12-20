import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthProvider'
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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees/*" element={<EmployeeManagement />} />
        <Route path="compliance" element={<ComplianceDashboard />} />
        <Route path="tickets" element={<EmployeeTickets />} />
        <Route path="tickets/:ticketId" element={<TicketDetailAdmin />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:clientId" element={<ClientDetail />} />
        <Route path="clients/:clientId/edit" element={<ClientForm />} />
        <Route path="vendors/*" element={<VendorManagement />} />
        <Route path="projects/*" element={<ProjectManagement />} />
        <Route path="documents/*" element={<DocumentManagement />} />
        <Route path="timesheets/*" element={<TimesheetManagement />} />
        <Route path="newsletters/*" element={<NewsletterManagement />} />
        <Route path="suggestions/*" element={<SuggestionManagement />} />
        <Route path="notifications" element={<NotificationsList />} />
        <Route path="data-admin/*" element={<DataAdministration />} />
        <Route path="settings" element={<SettingsManagement />} />
        <Route path="profile" element={<SettingsManagement />} />
        <Route path="issues" element={<IssueList />} />
        <Route path="issues/new" element={<IssueReport />} />
        <Route path="issues/:issueId" element={<IssueDetail />} />
        <Route path="issues/admin" element={<IssueManagement />} />
        {/* Additional routes will be added here */}
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/hrms/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/hrms/dashboard" replace />} />
      </Routes>
      <ToastContainer />
    </>
  )
}

export default App
