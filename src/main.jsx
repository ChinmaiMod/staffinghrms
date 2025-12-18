import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthProvider'
import { TenantProvider } from './contexts/TenantProvider'
import { PermissionsProvider } from './contexts/PermissionsProvider'
import './styles/index.css'
import './styles/design-system.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <PermissionsProvider>
            <App />
          </PermissionsProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
