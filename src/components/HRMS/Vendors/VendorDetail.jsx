import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, BuildingOffice2Icon, PencilIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './VendorDetail.css'

/**
 * VendorDetail - Vendor detail view
 * URL: /hrms/vendors/:vendorId
 * Based on UI_DESIGN_DOCS/07_VENDOR_MANAGEMENT.md
 */
function VendorDetail({ testMode = false }) {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(!testMode)
  const [error, setError] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (testMode) {
      setVendor({
        vendor_id: 'vendor-001',
        vendor_name: 'TechVendor Inc',
        vendor_code: 'TVI',
        vendor_type: 'primary',
        ein: '12-3456789',
        primary_contact_name: 'John Smith',
        primary_contact_email: 'john@techvendor.com',
        primary_contact_phone: '(972) 555-1234',
        accounts_payable_email: 'ap@techvendor.com',
        payment_terms_days: 30,
        receives_payment_terms_days: 45,
        invoice_frequency: 'bi_weekly',
        is_active: true,
        address_line_1: '123 Tech Park Drive',
        address_line_2: 'Suite 400',
        city: 'Dallas',
        state: 'TX',
        zip_code: '75001',
        country: 'USA',
        notes: '',
      })
      setLoading(false)
      return
    }

    if (vendorId && tenant?.tenant_id) {
      fetchVendor()
    }
  }, [vendorId, tenant?.tenant_id, testMode])

  const fetchVendor = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('hrms_vendors')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError
      setVendor(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching vendor:', err)
      setError(err.message || 'Failed to load vendor')
      setLoading(false)
    }
  }

  const maskEIN = (ein) => {
    if (!ein) return '-'
    const parts = ein.split('-')
    if (parts.length === 2) {
      return `**-***${parts[1].slice(-4)}`
    }
    return ein
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading vendor..." data-testid="loading-spinner" />
  }

  if (error) {
    return (
      <div className="vendor-detail-container">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchVendor}>Retry</button>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="vendor-detail-container">
        <p>Vendor not found</p>
        <Link to="/hrms/vendors">Back to Vendors</Link>
      </div>
    )
  }

  const VENDOR_TYPES = {
    primary: { label: 'Primary', bg: '#DBEAFE', text: '#1E40AF' },
    secondary: { label: 'Secondary', bg: '#FEF3C7', text: '#92400E' },
    implementation_partner: { label: 'Implementation Partner', bg: '#E0E7FF', text: '#3730A3' },
  }

  return (
    <div className="vendor-detail-container">
      <Link to="/hrms/vendors" className="back-link">
        <ArrowLeftIcon className="icon-sm" />
        Back to Vendors
      </Link>

      <div className="vendor-header">
        <div className="vendor-header-content">
          <BuildingOffice2Icon className="vendor-icon-large" />
          <div>
            <h1 className="vendor-name-title">{vendor.vendor_name}</h1>
            <div className="vendor-meta">
              <span>Code: {vendor.vendor_code}</span>
              <span>•</span>
              <span
                className="vendor-type-badge"
                style={{
                  backgroundColor: VENDOR_TYPES[vendor.vendor_type]?.bg || '#F3F4F6',
                  color: VENDOR_TYPES[vendor.vendor_type]?.text || '#374151',
                }}
              >
                {VENDOR_TYPES[vendor.vendor_type]?.label || vendor.vendor_type}
              </span>
              <span>•</span>
              <span className={`status-badge ${vendor.is_active ? 'status-active' : 'status-inactive'}`}>
                {vendor.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="vendor-header-actions">
          <Link to={`/hrms/vendors/${vendorId}/edit`} className="btn btn-secondary">
            <PencilIcon className="icon-sm" />
            Edit
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="vendor-tabs">
        <button
          className={activeTab === 'overview' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'projects' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="vendor-content">
          <div className="info-grid">
            <div className="info-card">
              <h3 className="card-title">Company Information</h3>
              <div className="info-item">
                <span className="info-label">EIN:</span>
                <span className="info-value">{maskEIN(vendor.ein)}</span>
              </div>
              {vendor.address_line_1 && (
                <div className="info-item">
                  <span className="info-label">Address:</span>
                  <span className="info-value">
                    {vendor.address_line_1}
                    {vendor.address_line_2 && `, ${vendor.address_line_2}`}
                    {vendor.city && `, ${vendor.city}`}
                    {vendor.state && `, ${vendor.state}`}
                    {vendor.zip_code && ` ${vendor.zip_code}`}
                    {vendor.country && `, ${vendor.country}`}
                  </span>
                </div>
              )}
            </div>

            <div className="info-card">
              <h3 className="card-title">Payment Terms</h3>
              <div className="info-item">
                <span className="info-label">We Pay In:</span>
                <span className="info-value">{vendor.payment_terms_days} days</span>
              </div>
              <div className="info-item">
                <span className="info-label">They Pay In:</span>
                <span className="info-value">{vendor.receives_payment_terms_days} days</span>
              </div>
              <div className="info-item">
                <span className="info-label">Invoice Frequency:</span>
                <span className="info-value">
                  {vendor.invoice_frequency === 'bi_weekly' ? 'Bi-Weekly' : vendor.invoice_frequency}
                </span>
              </div>
            </div>

            <div className="info-card">
              <h3 className="card-title">Primary Contact</h3>
              {vendor.primary_contact_name && (
                <div className="info-item">
                  <span className="info-value">{vendor.primary_contact_name}</span>
                </div>
              )}
              {vendor.primary_contact_email && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{vendor.primary_contact_email}</span>
                </div>
              )}
              {vendor.primary_contact_phone && (
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{vendor.primary_contact_phone}</span>
                </div>
              )}
            </div>

            <div className="info-card">
              <h3 className="card-title">Accounts Payable</h3>
              {vendor.accounts_payable_email && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{vendor.accounts_payable_email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="vendor-content">
          <p>Projects list will be implemented here</p>
        </div>
      )}
    </div>
  )
}

export default VendorDetail
