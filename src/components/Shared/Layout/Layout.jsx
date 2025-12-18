import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import './Layout.css'

/**
 * Main Layout component that wraps all authenticated pages
 * Contains Header, Sidebar, and main content area
 */
function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  return (
    <div className="layout" data-testid="layout">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
      />
      <div className={`layout-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header onMenuClick={toggleSidebar} />
        <main className="layout-content" data-testid="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
