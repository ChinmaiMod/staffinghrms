import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import BusinessFilter from '../../Shared/BusinessFilter'
import './VendorList.css'

// Vendor type configuration with colors
const VENDOR_TYPES = {
  primary: { label: 'Primary', bg: '#DBEAFE', text: '#1E40AF' },
  secondary: { label: 'Secondary', bg: '#FEF3C7', text: '#92400E' },
  implementation_partner: { label: 'Implementation Partner', bg: '#E0E7FF', text: '#3730A3' },
}

/**
 * VendorList - Vendor management list page
 * URL: /hrms/vendors
 * Based on UI_DESIGN_DOCS/07_VENDOR_MANAGEMENT.md
 */
function VendorList({ testMode = false }) {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vendors, setVendors] = useState([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [paymentTermsFilter, setPaymentTermsFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // Dropdown state
  const [openActionMenu, setOpenActionMenu] = useState(null)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, statusFilter, paymentTermsFilter])

  useEffect(() => {
    if (testMode) {
      // Mock data for testing
      setVendors([
        {
          vendor_id: 'vendor-001',
          vendor_name: 'TechVendor Inc',
          vendor_code: 'TVI',
          vendor_type: 'primary',
          ein: '12-3456789',
          primary_contact_name: 'John Smith',
          primary_contact_email: 'john@techvendor.com',
          primary_contact_phone: '(972) 555-1234',
          payment_terms_days: 30,
          is_active: true,
          active_projects: 12,
        },
      ])
      setTotalCount(1)
      setLoading(false)
      return
    }

    if (tenant?.tenant_id) {
      fetchVendors()
    }
  }, [tenant?.tenant_id, selectedBusiness?.business_id, searchQuery, typeFilter, statusFilter, paymentTermsFilter, currentPage, testMode])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id) {
        setError('Tenant not available')
        setLoading(false)
        return
      }

      // Build query - use left join to count projects
      let query = supabase
        .from('hrms_vendors')
        .select('*, hrms_project_vendors(project_id)', { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })

      // Filter by business if selected
      if (selectedBusiness?.business_id) {
        query = query.eq('business_id', selectedBusiness.business_id)
      }

      // Filter by status
      if (statusFilter === 'active') {
        query = query.eq('is_active', true)
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false)
      }

      // Filter by vendor type
      if (typeFilter !== 'all') {
        query = query.eq('vendor_type', typeFilter)
      }

      // Filter by payment terms
      if (paymentTermsFilter !== 'all') {
        query = query.eq('payment_terms_days', parseInt(paymentTermsFilter))
      }

      // Filter by search query
      if (searchQuery) {
        query = query.or(`vendor_name.ilike.%${searchQuery}%,vendor_code.ilike.%${searchQuery}%,ein.ilike.%${searchQuery}%`)
      }

      // Pagination
      const from = (currentPage - 1) * rowsPerPage
      const to = from + rowsPerPage - 1
      query = query.range(from, to)

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      // Transform data and count active projects
      const transformedVendors = (data || []).map((vendor) => ({
        vendor_id: vendor.vendor_id,
        vendor_name: vendor.vendor_name,
        vendor_code: vendor.vendor_code,
        vendor_type: vendor.vendor_type,
        ein: vendor.ein,
        primary_contact_name: vendor.primary_contact_name,
        primary_contact_email: vendor.primary_contact_email,
        primary_contact_phone: vendor.primary_contact_phone,
        payment_terms_days: vendor.payment_terms_days,
        is_active: vendor.is_active,
        active_projects: Array.isArray(vendor.hrms_project_vendors) ? vendor.hrms_project_vendors.length : 0,
        address_line_1: vendor.address_line_1,
        city: vendor.city,
        state: vendor.state,
        country: vendor.country,
        created_at: vendor.created_at,
      }))

      setVendors(transformedVendors)
      setTotalCount(count || 0)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching vendors:', err)
      setError(err.message || 'Failed to load vendors')
      setLoading(false)
    }
  }

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !vendor.vendor_name.toLowerCase().includes(query) &&
          !vendor.vendor_code.toLowerCase().includes(query) &&
          !vendor.ein?.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      return true
    })
  }, [vendors, searchQuery])

  const totalPages = Math.ceil(totalCount / rowsPerPage)

  // Mask EIN for display (show only last 4 digits)
  const maskEIN = (ein) => {
    if (!ein) return '-'
    const parts = ein.split('-')
    if (parts.length === 2) {
      return `**-***${parts[1].slice(-4)}`
    }
    return ein
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading vendors..." data-testid="loading-spinner" />
  }

  if (error) {
    return (
      <div className="vendor-list-container">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchVendors}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="vendor-list-container">
      <BusinessFilter />
      <div className="vendor-list-header">
        <div>
          <h1 className="page-title">Vendor Management</h1>
          <p className="page-subtitle">Manage staffing vendors for C2C project arrangements</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => console.log('Export CSV')}>
            <ArrowDownTrayIcon className="icon-sm" />
            Export CSV
          </button>
          <button className="btn btn-secondary">
            <Cog6ToothIcon className="icon-sm" />
            Customize
          </button>
          <Link to="/hrms/vendors/new" className="btn btn-primary">
            <PlusIcon className="icon-sm" />
            Add Vendor
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search by vendor name, code, EIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            data-testid="search-vendors-input"
          />
          <span className="search-shortcut">⌘K</span>
        </div>
        <div className="filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
            aria-label="Vendor Type"
          >
            <option value="all">All Types</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="implementation_partner">Implementation Partner</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
            aria-label="Status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={paymentTermsFilter}
            onChange={(e) => setPaymentTermsFilter(e.target.value)}
            className="filter-select"
            aria-label="Payment Terms"
          >
            <option value="all">All Payment Terms</option>
            <option value="15">Net 15</option>
            <option value="30">Net 30</option>
            <option value="45">Net 45</option>
            <option value="60">Net 60</option>
          </select>
          {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || paymentTermsFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setTypeFilter('all')
                setStatusFilter('active')
                setPaymentTermsFilter('all')
              }}
              className="btn btn-secondary"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Vendor Table */}
      <div className="vendor-table-wrapper">
        <table className="vendor-table">
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>EIN</th>
              <th>Primary Contact</th>
              <th>Payment Terms</th>
              <th>Active Projects</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  <p>No vendors found</p>
                  <Link to="/hrms/vendors/new" className="btn btn-primary">
                    Add First Vendor
                  </Link>
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => (
                <tr key={vendor.vendor_id}>
                  <td>
                    <div className="vendor-name-cell">
                      <BuildingOffice2Icon className="vendor-icon" />
                      <div>
                        <div className="vendor-name">{vendor.vendor_name}</div>
                        {vendor.city && vendor.state && (
                          <div className="vendor-location">{vendor.city}, {vendor.state}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="vendor-code">{vendor.vendor_code}</span>
                  </td>
                  <td>
                    <span
                      className="vendor-type-badge"
                      style={{
                        backgroundColor: VENDOR_TYPES[vendor.vendor_type]?.bg || '#F3F4F6',
                        color: VENDOR_TYPES[vendor.vendor_type]?.text || '#374151',
                      }}
                    >
                      {VENDOR_TYPES[vendor.vendor_type]?.label || vendor.vendor_type}
                    </span>
                  </td>
                  <td>{maskEIN(vendor.ein)}</td>
                  <td>
                    {vendor.primary_contact_email ? (
                      <div>
                        <div>{vendor.primary_contact_name || '-'}</div>
                        <div className="text-sm text-gray-500">{vendor.primary_contact_email}</div>
                        {vendor.primary_contact_phone && (
                          <div className="text-sm text-gray-500">{vendor.primary_contact_phone}</div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>Net {vendor.payment_terms_days}</td>
                  <td>
                    <span className="projects-count">{vendor.active_projects || 0}</span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        vendor.is_active ? 'status-active' : 'status-inactive'
                      }`}
                    >
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/hrms/vendors/${vendor.vendor_id}`}
                        className="icon-button"
                        title="View"
                      >
                        <EyeIcon className="icon-sm" />
                      </Link>
                      <Link
                        to={`/hrms/vendors/${vendor.vendor_id}/edit`}
                        className="icon-button"
                        title="Edit"
                      >
                        <PencilIcon className="icon-sm" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="pagination-info">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} vendors
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default VendorList
