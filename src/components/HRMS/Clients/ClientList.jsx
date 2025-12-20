import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BuildingOfficeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import BusinessFilter from '../../Shared/BusinessFilter'
import { useDebounce } from '../../../utils/debounce'
import './ClientList.css'

/**
 * ClientList - Client management list page
 * URL: /hrms/clients
 * Based on UI_DESIGN_DOCS/06_CLIENT_MANAGEMENT.md
 */
function ClientList() {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clients, setClients] = useState([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [typeFilter, setTypeFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // Dropdown state
  const [openActionMenu, setOpenActionMenu] = useState(null)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, typeFilter, industryFilter, statusFilter])

  useEffect(() => {
    if (tenant?.tenant_id) {
      fetchClients()
    }
  }, [tenant?.tenant_id, selectedBusiness?.business_id, debouncedSearchQuery, typeFilter, industryFilter, statusFilter, currentPage])

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id) {
        setError('Tenant not available')
        setLoading(false)
        return
      }

      // Build query
      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })

      // Filter by business if selected
      if (selectedBusiness?.business_id) {
        query = query.eq('business_id', selectedBusiness.business_id)
      }

      // Filter by status
      if (statusFilter === 'active') {
        query = query.eq('status', 'ACTIVE')
      } else if (statusFilter === 'inactive') {
        query = query.eq('status', 'INACTIVE')
      }

      // Filter by search query
      if (debouncedSearchQuery) {
        query = query.or(`client_name.ilike.%${debouncedSearchQuery}%,website.ilike.%${debouncedSearchQuery}%`)
      }

      // Filter by industry
      if (industryFilter !== 'all') {
        query = query.eq('industry', industryFilter)
      }

      // Pagination
      const from = (currentPage - 1) * rowsPerPage
      const to = from + rowsPerPage - 1
      query = query.range(from, to)

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      // Transform data
      const transformedClients = (data || []).map((client) => ({
        id: client.client_id,
        name: client.client_name,
        website: client.website,
        industry: client.industry,
        status: client.status,
        primaryContactEmail: client.primary_contact_email,
        primaryContactPhone: client.primary_contact_phone,
        address: client.address,
        city: client.city,
        state: client.state,
        country: client.country,
        postalCode: client.postal_code,
        createdAt: client.created_at,
      }))

      setClients(transformedClients)
      setTotalCount(count || 0)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err.message || 'Failed to load clients')
      setLoading(false)
    }
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase()
        if (
          !client.name.toLowerCase().includes(query) &&
          !client.website?.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      return true
    })
  }, [clients, debouncedSearchQuery])

  const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
  const totalPages = Math.ceil(totalCount / rowsPerPage)

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading clients..." />
  }

  if (error) {
    return (
      <div className="client-list-container">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchClients}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="client-list-container">
      <BusinessFilter />
      <div className="client-list-header">
        <div>
          <h1 className="page-title">Client Management</h1>
          <p className="page-subtitle">Manage end clients for employee project placements</p>
        </div>
        <div className="header-actions">
          <Link to="/hrms/clients/new" className="btn btn-primary">
            <PlusIcon className="icon-sm" />
            Add Client
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search by client name, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchQuery || industryFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setIndustryFilter('all')
                setStatusFilter('active')
              }}
              className="btn btn-secondary"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Client Table */}
      <div className="client-table-wrapper">
        <table className="client-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Industry</th>
              <th>Primary Contact</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <p>No clients found</p>
                  <Link to="/hrms/clients/new" className="btn btn-primary">
                    Add First Client
                  </Link>
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="client-name-cell">
                      <BuildingOfficeIcon className="client-icon" />
                      <div>
                        <div className="client-name">{client.name}</div>
                        {client.website && (
                          <div className="client-website">{client.website}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{client.industry || '-'}</td>
                  <td>
                    {client.primaryContactEmail ? (
                      <div>
                        <div>{client.primaryContactEmail}</div>
                        {client.primaryContactPhone && (
                          <div className="text-sm text-gray-500">{client.primaryContactPhone}</div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {client.city && client.state ? (
                      <div>
                        {client.city}, {client.state}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        client.status === 'ACTIVE' ? 'status-active' : 'status-inactive'
                      }`}
                    >
                      {client.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/hrms/clients/${client.id}`}
                        className="icon-button"
                        title="View"
                      >
                        <EyeIcon className="icon-sm" />
                      </Link>
                      <Link
                        to={`/hrms/clients/${client.id}/edit`}
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
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default ClientList
