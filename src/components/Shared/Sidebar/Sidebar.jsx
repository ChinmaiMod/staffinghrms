import { NavLink, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import DashboardIcon from './DashboardIcon'
import {
  ComplianceIcon,
  TicketsIcon,
  EmployeesIcon,
  ClientsIcon,
  VendorsIcon,
  ProjectsIcon,
  DocumentsIcon,
  ImmigrationIcon,
  TimesheetsIcon,
  AdminIcon,
  NewsletterIcon,
  ProfileIcon,
} from './ColorfulIcons'
import { BellIcon, LightBulbIcon, BugAntIcon } from '@heroicons/react/24/outline'
import { usePermissions } from '../../../contexts/PermissionsProvider'
import './Sidebar.css'

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    path: '/hrms/dashboard',
  },
  {
    id: 'compliance',
    label: 'Compliance Dashboard',
    icon: ComplianceIcon,
    path: '/hrms/compliance',
  },
  {
    id: 'tickets',
    label: 'Employee Tickets',
    icon: TicketsIcon,
    path: '/hrms/tickets',
  },
  {
    id: 'employees',
    label: 'Employee Management',
    icon: EmployeesIcon,
    path: '/hrms/employees',
  },
  {
    id: 'clients',
    label: 'Client Management',
    icon: ClientsIcon,
    path: '/hrms/clients',
  },
  {
    id: 'vendors',
    label: 'Vendor Management',
    icon: VendorsIcon,
    path: '/hrms/vendors',
  },
  {
    id: 'projects',
    label: 'Employee Projects',
    icon: ProjectsIcon,
    path: '/hrms/projects',
  },
  {
    id: 'documents',
    label: 'Document Management',
    icon: DocumentsIcon,
    path: '/hrms/documents',
  },
  {
    id: 'immigration',
    label: 'Visa & Immigration',
    icon: ImmigrationIcon,
    path: '/hrms/immigration',
  },
  {
    id: 'timesheets',
    label: 'Timesheet Management',
    icon: TimesheetsIcon,
    path: '/hrms/timesheets',
  },
  { type: 'divider' },
  {
    id: 'admin',
    label: 'Data Administration',
    icon: AdminIcon,
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
    icon: NewsletterIcon,
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
    icon: ProfileIcon,
    path: '/hrms/profile',
  },
]

/**
 * Sidebar navigation component
 * Supports collapsed/expanded states with icons and labels
 * Filters menu items based on user permissions
 */
function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const { hasMenuAccess, roleLevel, loading: permissionsLoading } = usePermissions()

  const isActive = (path) => {
    return location.pathname.startsWith(path)
  }

  // Filter menu items based on permissions
  // Super admin (level 4) sees all items
  // Others only see items they have permission for
  const filteredMenuItems = useMemo(() => {
    if (permissionsLoading) {
      return []
    }

    // Super admin (level 5) sees everything
    if (roleLevel === 5) {
      return menuItems
    }

    // Filter menu items based on permissions
    return menuItems.filter(item => {
      if (item.type === 'divider') {
        return true // Keep dividers
      }

      // Extract path or code from menu item
      // Try to match by path first, then by id (which might match item_code)
      const path = item.path
      const code = item.id?.toUpperCase()

      // Check permission by path or code
      return hasMenuAccess(path) || hasMenuAccess(code)
    })
  }, [hasMenuAccess, roleLevel, permissionsLoading])

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
          {filteredMenuItems.map((item, index) => {
            if (item.type === 'divider') {
              return <li key={`divider-${index}`} className="sidebar-divider" role="separator" />
            }

            const Icon = item.icon
            const getIconColor = (isActive) => {
              // Colorful icons have their own colors, don't override
              const colorfulIcons = ['dashboard', 'compliance', 'tickets', 'employees', 'clients', 'vendors', 'projects', 'documents', 'immigration', 'timesheets', 'admin', 'newsletter', 'profile']
              if (colorfulIcons.includes(item.id)) return undefined
              if (isActive) return '#FFFFFF'
              switch (item.id) {
                case 'notifications':
                  return '#FBBF24'
                case 'suggestions':
                  return '#FCD34D'
                case 'issues':
                  return '#10B981'
                default:
                  return '#FFFFFF'
              }
            }
            
            return (
              <li key={item.id} className="sidebar-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                  data-testid={`nav-${item.id}`}
                  data-icon={item.id}
                >
                  {({ isActive }) => {
                    const iconColor = getIconColor(isActive)
                    return (
                      <>
                        <Icon 
                          className="sidebar-icon" 
                          aria-hidden="true"
                          style={iconColor ? { color: iconColor } : undefined}
                        />
                        {!collapsed && <span className="sidebar-label">{item.label}</span>}
                      </>
                    )
                  }}
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
