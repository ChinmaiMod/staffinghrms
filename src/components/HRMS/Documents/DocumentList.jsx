import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import BusinessFilter from '../../Shared/BusinessFilter'
import { useDebounce } from '../../../utils/debounce'
import './DocumentList.css'

/**
 * DocumentList - Document management list page
 * URL: /hrms/documents
 * Based on UI_DESIGN_DOCS/09_DOCUMENT_MANAGEMENT.md
 */
function DocumentList() {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [hasAnyDocuments, setHasAnyDocuments] = useState(false) // Track if any documents exist for empty state distinction

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [entityTypeFilter, setEntityTypeFilter] = useState('all')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expiryFilter, setExpiryFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // Dropdown state
  const [openActionMenu, setOpenActionMenu] = useState(null)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, entityTypeFilter, documentTypeFilter, statusFilter, expiryFilter])

  useEffect(() => {
    if (tenant?.tenant_id) {
      fetchDocuments()
    }
  }, [
    tenant?.tenant_id,
    selectedBusiness?.business_id,
    debouncedSearchQuery,
    entityTypeFilter,
    documentTypeFilter,
    statusFilter,
    expiryFilter,
    currentPage,
  ])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id) {
        setError('Tenant not available')
        setLoading(false)
        return
      }

      // Build query - fetch documents first, then enrich with related entities
      let query = supabase
        .from('hrms_documents')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('uploaded_at', { ascending: false })

      // Filter by business if selected
      if (selectedBusiness?.business_id) {
        query = query.or(
          `business_id.eq.${selectedBusiness.business_id},business_id.is.null`
        )
      }

      // Filter by entity type
      if (entityTypeFilter !== 'all') {
        query = query.eq('entity_type', entityTypeFilter)
      }

      // Filter by document type
      if (documentTypeFilter !== 'all') {
        query = query.eq('document_type', documentTypeFilter)
      }

      // Filter by status and expiry - consolidate logic to avoid conflicts
      // Priority: expiryFilter takes precedence over statusFilter for expiry-related filters
      if (expiryFilter === 'expiring_7_days') {
        const date7Days = new Date()
        date7Days.setDate(date7Days.getDate() + 7)
        query = query
          .eq('document_status', 'active')
          .lte('expiry_date', date7Days.toISOString().split('T')[0])
          .gte('expiry_date', new Date().toISOString().split('T')[0])
      } else if (expiryFilter === 'expiring_30_days') {
        const date30Days = new Date()
        date30Days.setDate(date30Days.getDate() + 30)
        query = query
          .eq('document_status', 'active')
          .lte('expiry_date', date30Days.toISOString().split('T')[0])
          .gte('expiry_date', new Date().toISOString().split('T')[0])
      } else if (expiryFilter === 'expired') {
        query = query.lt('expiry_date', new Date().toISOString().split('T')[0])
      } else if (expiryFilter === 'no_expiry') {
        query = query.is('expiry_date', null)
      } else {
        // Apply status filter only if expiry filter is not set
        if (statusFilter === 'valid') {
          query = query.eq('document_status', 'active')
        } else if (statusFilter === 'expiring') {
          const date30Days = new Date()
          date30Days.setDate(date30Days.getDate() + 30)
          query = query
            .eq('document_status', 'active')
            .lte('expiry_date', date30Days.toISOString().split('T')[0])
            .gte('expiry_date', new Date().toISOString().split('T')[0])
        } else if (statusFilter === 'expired') {
          query = query.eq('document_status', 'expired')
        }
      }

      // Filter by search query
      if (searchQuery) {
        query = query.or(`document_name.ilike.%${searchQuery}%,file_name.ilike.%${searchQuery}%`)
      }

      // Pagination
      const from = (currentPage - 1) * rowsPerPage
      const to = from + rowsPerPage - 1
      query = query.range(from, to)

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      // Enrich documents with related entity data
      const enrichedDocuments = await enrichDocumentsWithEntities(data || [])

      setDocuments(enrichedDocuments)
      setTotalCount(count || 0)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err.message || 'Failed to load documents')
      setLoading(false)
    }
  }

  const getStatusBadge = (document) => {
    if (document.document_status === 'expired') {
      return {
        icon: XCircleIcon,
        label: 'Expired',
        className: 'status-expired',
      }
    }
    if (document.expiry_date) {
      const expiryDate = new Date(document.expiry_date)
      const today = new Date()
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry < 0) {
        return {
          icon: XCircleIcon,
          label: 'Expired',
          className: 'status-expired',
        }
      } else if (daysUntilExpiry <= 7) {
        return {
          icon: ExclamationTriangleIcon,
          label: `${daysUntilExpiry} days left`,
          className: 'status-expiring-urgent',
        }
      } else if (daysUntilExpiry <= 30) {
        return {
          icon: ExclamationTriangleIcon,
          label: `${daysUntilExpiry} days left`,
          className: 'status-expiring',
        }
      } else {
        return {
          icon: CheckCircleIcon,
          label: 'Valid',
          className: 'status-valid',
        }
      }
    }
    return {
      icon: CheckCircleIcon,
      label: 'Valid',
      className: 'status-valid',
    }
  }

  const getEntityName = (document) => {
    if (document.entity_type === 'employee' && document.employee) {
      return `${document.employee.first_name} ${document.employee.last_name} (${document.employee.employee_code})`
    }
    if (document.entity_type === 'project' && document.project) {
      return `${document.project.project_name} (${document.project.project_code || 'N/A'})`
    }
    return `${document.entity_type} (${document.entity_id.substring(0, 8)}...)`
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Enrich documents with related entity information
  const enrichDocumentsWithEntities = async (documents) => {
    if (!documents || documents.length === 0) return documents

    try {
      // Group documents by entity type
      const employeeDocs = documents.filter(doc => doc.entity_type === 'employee')
      const projectDocs = documents.filter(doc => doc.entity_type === 'project')

      // Fetch employee data for employee documents
      const employeeIds = [...new Set(employeeDocs.map(doc => doc.entity_id))]
      let employeesMap = {}
      if (employeeIds.length > 0) {
        try {
          const { data: employees, error: empError } = await supabase
            .from('hrms_employees')
            .select('employee_id, first_name, last_name, employee_code')
            .in('employee_id', employeeIds)
          
          if (empError) {
            console.error('Error fetching employees for documents:', empError)
          } else if (employees) {
            employeesMap = employees.reduce((acc, emp) => {
              acc[emp.employee_id] = emp
              return acc
            }, {})
          }
        } catch (err) {
          console.error('Error enriching employee documents:', err)
          // Continue with empty map - documents will show without employee info
        }
      }

      // Fetch project data for project documents
      const projectIds = [...new Set(projectDocs.map(doc => doc.entity_id))]
      let projectsMap = {}
      if (projectIds.length > 0) {
        try {
          const { data: projects, error: projError } = await supabase
            .from('hrms_projects')
            .select('project_id, project_name, project_code')
            .in('project_id', projectIds)
          
          if (projError) {
            console.error('Error fetching projects for documents:', projError)
          } else if (projects) {
            projectsMap = projects.reduce((acc, proj) => {
              acc[proj.project_id] = proj
              return acc
            }, {})
          }
        } catch (err) {
          console.error('Error enriching project documents:', err)
          // Continue with empty map - documents will show without project info
        }
      }

      // Enrich documents with related entity data
      return documents.map(doc => {
        if (doc.entity_type === 'employee' && employeesMap[doc.entity_id]) {
          return { ...doc, employee: employeesMap[doc.entity_id] }
        }
        if (doc.entity_type === 'project' && projectsMap[doc.entity_id]) {
          return { ...doc, project: projectsMap[doc.entity_id] }
        }
        return doc
      })
    } catch (err) {
      console.error('Error enriching documents:', err)
      // Return documents without enrichment rather than failing completely
      return documents
    }
  }

  const handleDownload = async (document) => {
    try {
      if (!document.file_path) {
        alert('File path not available')
        return
      }

      // Handle different file_path formats:
      // Format 1: "bucket-name/path/to/file.pdf"
      // Format 2: "/bucket-name/path/to/file.pdf"
      // Format 3: "path/to/file.pdf" (assumes default bucket)
      let bucket, filePath

      const pathParts = document.file_path.split('/').filter(part => part.length > 0)
      
      if (pathParts.length === 0) {
        throw new Error('Invalid file path format')
      }

      // Check if first part looks like a bucket name (no dots, typically lowercase)
      // If path starts with known bucket pattern or has storage indicator
      if (pathParts.length > 1) {
        // Assume first part is bucket if we have multiple parts
        bucket = pathParts[0]
        filePath = pathParts.slice(1).join('/')
      } else {
        // Single part - might be just the file path, try default bucket or use storage bucket
        // For now, assume it's a full path in a default bucket
        // You may need to adjust this based on your storage setup
        bucket = 'documents' // Default bucket name - adjust as needed
        filePath = pathParts[0]
      }

      if (!bucket || !filePath) {
        throw new Error('Could not parse file path')
      }

      const { data, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(filePath)

      if (downloadError) {
        // Try alternative: maybe file_path is already the full path
        if (downloadError.message?.includes('not found') || downloadError.message?.includes('Bucket')) {
          // Try treating entire path as file path in default bucket
          const { data: altData, error: altError } = await supabase.storage
            .from('documents')
            .download(document.file_path)
          
          if (altError) throw altError
          
          // Use alternative data
          const url = window.URL.createObjectURL(altData)
          const a = document.createElement('a')
          a.href = url
          a.download = document.file_name || 'download'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          return
        }
        throw downloadError
      }

      // Create download link
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = document.file_name || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading document:', err)
      alert(`Failed to download document: ${err.message || 'Unknown error'}`)
    }
  }

  const totalPages = Math.ceil(totalCount / rowsPerPage)

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading documents..." />
  }

  if (error) {
    return (
      <div className="document-list-error">
        <p>{error}</p>
        <button onClick={() => fetchDocuments()}>Retry</button>
      </div>
    )
  }

  return (
    <div className="document-list" data-testid="document-list">
      {/* Business Filter */}
      <BusinessFilter />

      {/* Header */}
      <div className="document-list-header">
        <div>
          <h1>Documents</h1>
          <p className="document-list-subtitle">
            Manage and track all documents across employees, projects, and compliance
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/hrms/documents/upload')}
          data-testid="upload-doc-button"
        >
          <PlusIcon className="icon-sm" />
          Upload Doc
        </button>
      </div>

      {/* Filters */}
      <div className="document-list-filters">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            data-testid="entity-type-filter"
          >
            <option value="all">Entity: All</option>
            <option value="employee">Employee</option>
            <option value="project">Project</option>
            <option value="timesheet">Timesheet</option>
            <option value="compliance">Compliance</option>
          </select>

          <select
            value={documentTypeFilter}
            onChange={(e) => setDocumentTypeFilter(e.target.value)}
            data-testid="document-type-filter"
          >
            <option value="all">Type: All</option>
            <option value="passport">Passport</option>
            <option value="visa">Visa</option>
            <option value="i9">I-9</option>
            <option value="w4">W-4</option>
            <option value="h1b">H1B</option>
            <option value="msa">MSA</option>
            <option value="po">PO</option>
            <option value="coi">COI</option>
            <option value="license">License</option>
            <option value="certificate">Certificate</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="status-filter"
          >
            <option value="all">Status: All</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            data-testid="expiry-filter"
          >
            <option value="all">Expiry: All</option>
            <option value="expiring_7_days">Expiring in 7 days</option>
            <option value="expiring_30_days">Expiring in 30 days</option>
            <option value="expired">Expired</option>
            <option value="no_expiry">No Expiry</option>
          </select>

          {(entityTypeFilter !== 'all' ||
            documentTypeFilter !== 'all' ||
            statusFilter !== 'all' ||
            expiryFilter !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEntityTypeFilter('all')
                setDocumentTypeFilter('all')
                setStatusFilter('all')
                setExpiryFilter('all')
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="document-list-table-container">
        <table className="document-list-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Entity</th>
              <th>Type</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <DocumentTextIcon className="empty-icon" />
                  <p>No documents found</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/hrms/documents/upload')}
                  >
                    Upload First Document
                  </button>
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const status = getStatusBadge(doc)
                const StatusIcon = status.icon

                return (
                  <tr key={doc.document_id}>
                    <td>
                      <div className="document-name-cell">
                        <DocumentTextIcon className="document-icon" />
                        <div>
                          <div className="document-name">{doc.document_name}</div>
                          <div className="document-meta">
                            {formatFileSize(doc.size_bytes)} • {formatDate(doc.uploaded_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="entity-name">{getEntityName(doc)}</span>
                    </td>
                    <td>
                      <span className="document-type-badge">{doc.document_type || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${status.className}`}>
                        <StatusIcon className="status-icon" />
                        {status.label}
                      </span>
                    </td>
                    <td>{formatDate(doc.expiry_date)}</td>
                    <td>
                      <div className="document-actions">
                        <button
                          className="icon-button"
                          onClick={() => navigate(`/hrms/documents/${doc.document_id}`)}
                          title="View"
                          data-testid={`view-doc-${doc.document_id}`}
                        >
                          <EyeIcon className="icon-sm" />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => handleDownload(doc)}
                          title="Download"
                          data-testid={`download-doc-${doc.document_id}`}
                        >
                          <ArrowDownTrayIcon className="icon-sm" />
                        </button>
                        <div className="dropdown-container">
                          <button
                            className="icon-button"
                            onClick={() =>
                              setOpenActionMenu(
                                openActionMenu === doc.document_id ? null : doc.document_id
                              )
                            }
                            title="More actions"
                          >
                            <EllipsisVerticalIcon className="icon-sm" />
                          </button>
                          {openActionMenu === doc.document_id && (
                            <div className="dropdown-menu">
                              <button onClick={() => navigate(`/hrms/documents/${doc.document_id}/versions`)}>
                                View Versions
                              </button>
                              <button onClick={() => navigate(`/hrms/documents/${doc.document_id}/edit`)}>
                                Edit Info
                              </button>
                              <button className="danger">Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="document-list-pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            &lt; Prev
          </button>
          <span>
            Showing {((currentPage - 1) * rowsPerPage) + 1}-
            {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} documents
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next &gt;
          </button>
        </div>
      )}
    </div>
  )
}

export default DocumentList
