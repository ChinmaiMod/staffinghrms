import { NavLink, useLocation } from 'react-router-dom'
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  TicketIcon,
  UsersIcon,
  BuildingOfficeIcon,
  TruckIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  GlobeAmericasIcon,
  ClockIcon,
  Cog6ToothIcon,
  BellIcon,
  NewspaperIcon,
  LightBulbIcon,
  BugAntIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import './Sidebar.css'

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: ChartBarIcon,
    path: '/hrms/dashboard',
  },
  {
    id: 'compliance',
    label: 'Compliance Dashboard',
    icon: ExclamationTriangleIcon,
    path: '/hrms/compliance',
  },
  {
    id: 'tickets',
    label: 'Employee Tickets',
    icon: TicketIcon,
    path: '/hrms/tickets',
  },
  {
    id: 'employees',
    label: 'Employee Management',
    icon: UsersIcon,
    path: '/hrms/employees',
  },
  {
    id: 'clients',
    label: 'Client Management',
    icon: BuildingOfficeIcon,
    path: '/hrms/clients',
  },
  {
    id: 'vendors',
    label: 'Vendor Management',
    icon: TruckIcon,
    path: '/hrms/vendors',
  },
  {
    id: 'projects',
    label: 'Employee Projects',
    icon: BriefcaseIcon,
    path: '/hrms/projects',
  },
  {
    id: 'documents',
    label: 'Document Management',
    icon: DocumentTextIcon,
    path: '/hrms/documents',
  },
  {
    id: 'immigration',
    label: 'Visa & Immigration',
    icon: GlobeAmericasIcon,
    path: '/hrms/immigration',
  },
  {
    id: 'timesheets',
    label: 'Timesheet Management',
    icon: ClockIcon,
    path: '/hrms/timesheets',
  },
  { type: 'divider' },
  {
    id: 'admin',
    label: 'Data Administration',
    icon: Cog6ToothIcon,
    path: '/hrms/data-admin',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellIcon,
    path: '/hrms/notifications',
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    icon: NewspaperIcon,
    path: '/hrms/newsletter',
  },
  { type: 'divider' },
  {
    id: 'suggestions',
    label: 'Suggestions & Ideas',
    icon: LightBulbIcon,
    path: '/hrms/suggestions',
  },
  {
    id: 'issues',
    label: 'Report an Issue',
    icon: BugAntIcon,
    path: '/hrms/issues',
  },
  {
    id: 'profile',
    label: 'Profile & Settings',
    icon: UserCircleIcon,
    path: '/hrms/profile',
  },
]

/**
 * Sidebar navigation component
 * Supports collapsed/expanded states with icons and labels
 */
function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname.startsWith(path)
  }

  return (
    <aside 
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      data-testid="sidebar"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">📊</span>
          {!collapsed && <span className="logo-text">HRMS</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          data-testid="sidebar-toggle"
        >
          {collapsed ? (
            <ChevronRightIcon className="toggle-icon" />
          ) : (
            <ChevronLeftIcon className="toggle-icon" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="sidebar-menu" role="list">
          {menuItems.map((item, index) => {
            if (item.type === 'divider') {
              return <li key={`divider-${index}`} className="sidebar-divider" role="separator" />
            }

            const Icon = item.icon
            return (
              <li key={item.id} className="sidebar-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className="sidebar-icon" aria-hidden="true" />
                  {!collapsed && <span className="sidebar-label">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-version">
            <span>v0.1.0</span>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
