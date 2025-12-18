import { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import './Header.css'

/**
 * Generates breadcrumb items from current path
 */
function generateBreadcrumbs(pathname) {
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = []
  
  const labelMap = {
    'hrms': 'HRMS',
    'dashboard': 'Dashboard',
    'compliance': 'Compliance',
    'tickets': 'Tickets',
    'employees': 'Employees',
    'clients': 'Clients',
    'vendors': 'Vendors',
    'projects': 'Projects',
    'documents': 'Documents',
    'immigration': 'Immigration',
    'timesheets': 'Timesheets',
    'data-admin': 'Data Administration',
    'notifications': 'Notifications',
    'newsletter': 'Newsletter',
    'suggestions': 'Suggestions',
    'issues': 'Issues',
    'profile': 'Profile',
    'new': 'New',
    'edit': 'Edit',
  }

  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    // Skip 'hrms' in breadcrumb display
    if (segment === 'hrms') return
    
    breadcrumbs.push({
      label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: currentPath,
      isLast: index === pathSegments.length - 1,
    })
  })

  return breadcrumbs
}

/**
 * Header component with breadcrumbs, search, business selector, and user menu
 */
function Header({ onMenuClick, sidebarCollapsed }) {
  const location = useLocation()
  const { tenant, selectedBusiness, businesses, setSelectedBusiness } = useTenant()
  const { user, profile, signOut } = useAuth()
  
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const businessDropdownRef = useRef(null)
  const userMenuRef = useRef(null)
  
  const breadcrumbs = generateBreadcrumbs(location.pathname)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target)) {
        setShowBusinessDropdown(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBusinessSelect = (business) => {
    setSelectedBusiness(business)
    setShowBusinessDropdown(false)
  }

  const handleSignOut = async () => {
    setShowUserMenu(false)
    await signOut()
  }

  const displayName = profile?.full_name || user?.email || 'User'
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="header" data-testid="header" role="banner">
      <div className="header-left">
        {/* Mobile Menu Button */}
        <button
          className="header-menu-btn mobile-only"
          onClick={onMenuClick}
          aria-label="Toggle menu"
          data-testid="mobile-menu-btn"
        >
          <Bars3Icon className="header-icon" />
        </button>

        {/* Breadcrumbs */}
        <nav className="header-breadcrumbs" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.path} className="breadcrumb-item">
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                {crumb.isLast ? (
                  <span className="breadcrumb-current">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="header-center">
        {/* Global Search */}
        <div className="header-search">
          <MagnifyingGlassIcon className="search-icon" aria-hidden="true" />
          <input
            type="search"
            className="search-input"
            placeholder="Search employees, projects, documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Global search"
            data-testid="global-search"
          />
          <kbd className="search-shortcut">⌘K</kbd>
        </div>
      </div>

      <div className="header-right">
        {/* Business Selector */}
        {businesses && businesses.length > 0 && (
          <div className="business-selector" ref={businessDropdownRef}>
            <button
              className="business-selector-btn"
              onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
              aria-expanded={showBusinessDropdown}
              aria-haspopup="listbox"
              data-testid="business-selector"
            >
              <BuildingOfficeIcon className="business-icon" aria-hidden="true" />
              <span className="business-name">
                {selectedBusiness?.business_name || 'All Businesses'}
              </span>
              <ChevronDownIcon className="chevron-icon" aria-hidden="true" />
            </button>
            
            {showBusinessDropdown && (
              <div className="business-dropdown" role="listbox">
                <button
                  className={`business-option ${!selectedBusiness ? 'selected' : ''}`}
                  onClick={() => handleBusinessSelect(null)}
                  role="option"
                  aria-selected={!selectedBusiness}
                >
                  <span>All Businesses</span>
                </button>
                {businesses.map((business) => (
                  <button
                    key={business.id}
                    className={`business-option ${selectedBusiness?.id === business.id ? 'selected' : ''}`}
                    onClick={() => handleBusinessSelect(business)}
                    role="option"
                    aria-selected={selectedBusiness?.id === business.id}
                  >
                    <span>{business.business_name}</span>
                    {business.division_type && (
                      <span className="business-type">{business.division_type}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <button
          className="header-icon-btn"
          aria-label="Notifications"
          data-testid="notifications-btn"
        >
          <BellIcon className="header-icon" />
          <span className="notification-badge">3</span>
        </button>

        {/* User Menu */}
        <div className="user-menu" ref={userMenuRef}>
          <button
            className="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            data-testid="user-menu-btn"
          >
            <div className="user-avatar" aria-hidden="true">
              {initials}
            </div>
            <ChevronDownIcon className="chevron-icon" aria-hidden="true" />
          </button>
          
          {showUserMenu && (
            <div className="user-dropdown" role="menu">
              <div className="user-info">
                <div className="user-avatar-large">{initials}</div>
                <div className="user-details">
                  <span className="user-name">{displayName}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <Link
                to="/hrms/profile"
                className="dropdown-item"
                role="menuitem"
                onClick={() => setShowUserMenu(false)}
              >
                <UserCircleIcon className="dropdown-icon" />
                <span>Profile</span>
              </Link>
              <Link
                to="/hrms/profile/settings"
                className="dropdown-item"
                role="menuitem"
                onClick={() => setShowUserMenu(false)}
              >
                <Cog6ToothIcon className="dropdown-icon" />
                <span>Settings</span>
              </Link>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item danger"
                role="menuitem"
                onClick={handleSignOut}
              >
                <ArrowRightOnRectangleIcon className="dropdown-icon" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
