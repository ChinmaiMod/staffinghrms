import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthProvider'
import { TenantProvider } from './contexts/TenantProvider'
import { PermissionsProvider } from './contexts/PermissionsProvider'
import { ToastProvider } from './contexts/ToastProvider'
import './styles/design-system.css'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <PermissionsProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </PermissionsProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
