import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  DocumentPlusIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './DocumentViewer.css'

/**
 * DocumentViewer - Document detail viewer with preview
 * URL: /hrms/documents/:documentId
 * Based on UI_DESIGN_DOCS/09_DOCUMENT_MANAGEMENT.md section 2
 */
function DocumentViewer() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [document, setDocument] = useState(null)
  const [versions, setVersions] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (documentId && tenant?.tenant_id) {
      fetchDocument()
      fetchVersions()
    }
  }, [documentId, tenant?.tenant_id])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('hrms_documents')
        .select(
          `
          *,
          employee:hrms_employees!hrms_documents_entity_id_fkey(
            employee_id,
            first_name,
            last_name,
            employee_code
          ),
          project:hrms_projects!hrms_documents_entity_id_fkey(
            project_id,
            project_name,
            project_code
          ),
          uploaded_by_user:profiles!hrms_documents_uploaded_by_fkey(
            id,
            full_name,
            email
          )
        `
        )
        .eq('document_id', documentId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      setDocument(data)

      // Load preview URL
      if (data?.file_path) {
        const [bucket, ...pathParts] = data.file_path.split('/')
        const filePath = pathParts.join('/')

        const { data: urlData, error: urlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600)

        if (!urlError && urlData) {
          setPreviewUrl(urlData.signedUrl)
        }
      }
    } catch (err) {
      console.error('Error fetching document:', err)
      setError(err.message || 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const fetchVersions = async () => {
    if (!documentId) return

    try {
      const { data, error: fetchError } = await supabase
        .from('hrms_documents')
        .select('*')
        .or(`document_id.eq.${documentId},parent_document_id.eq.${documentId}`)
        .order('version_number', { ascending: false })

      if (fetchError) throw fetchError

      setVersions(data || [])
    } catch (err) {
      console.error('Error fetching versions:', err)
    }
  }

  const handleDownload = async () => {
    if (!document) return

    try {
      const [bucket, ...pathParts] = document.file_path.split('/')
      const filePath = pathParts.join('/')

      const { data, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(filePath)

      if (downloadError) throw downloadError

      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = document.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading document:', err)
      alert('Failed to download document')
    }
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
      month: 'long',
      day: 'numeric',
    })
  }

  const getEntityName = () => {
    if (document?.entity_type === 'employee' && document.employee) {
      return `${document.employee.first_name} ${document.employee.last_name} (${document.employee.employee_code})`
    }
    if (document?.entity_type === 'project' && document.project) {
      return `${document.project.project_name} (${document.project.project_code || 'N/A'})`
    }
    return `${document?.entity_type || 'Unknown'}`
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading document..." />
  }

  if (error || !document) {
    return (
      <div className="document-viewer-error">
        <p>{error || 'Document not found'}</p>
        <button onClick={() => navigate('/hrms/documents')}>Back to Documents</button>
      </div>
    )
  }

  const isImage = document.content_type?.startsWith('image/')
  const isPDF = document.content_type === 'application/pdf'

  return (
    <div className="document-viewer" data-testid="document-viewer">
      {/* Header */}
      <div className="document-viewer-header">
        <button
          className="back-button"
          onClick={() => navigate('/hrms/documents')}
          data-testid="back-button"
        >
          <ArrowLeftIcon className="icon-sm" />
          Back to Documents
        </button>
      </div>

      <div className="document-viewer-content">
        {/* Preview Panel */}
        <div className="document-preview-panel">
          <div className="preview-container">
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={document.document_name}
                className="preview-image"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                  transition: 'transform 0.3s',
                }}
              />
            ) : isPDF && previewUrl ? (
              <iframe
                src={previewUrl}
                className="preview-iframe"
                title={document.document_name}
              />
            ) : (
              <div className="preview-unavailable">
                <DocumentPlusIcon className="unavailable-icon" />
                <p>Preview not available</p>
                <button className="btn btn-primary" onClick={handleDownload}>
                  Download Document
                </button>
              </div>
            )}
          </div>

          {/* Preview Controls */}
          {(isImage || isPDF) && (
            <div className="preview-controls">
              <button
                className="control-button"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                disabled={zoom <= 50}
              >
                <MagnifyingGlassMinusIcon className="icon-sm" />
              </button>
              <span className="zoom-level">{zoom}%</span>
              <button
                className="control-button"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <MagnifyingGlassPlusIcon className="icon-sm" />
              </button>
              {isImage && (
                <button
                  className="control-button"
                  onClick={() => setRotation((rotation + 90) % 360)}
                >
                  <ArrowPathIcon className="icon-sm" />
                  Rotate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="document-info-panel">
          <div className="info-section">
            <h3>DOCUMENT INFO</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{document.document_name}</span>
              </div>
              <div className="info-item">
                <label>Type:</label>
                <span>{document.document_type || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Entity:</label>
                <span>{getEntityName()}</span>
              </div>
              <div className="info-item">
                <label>Uploaded:</label>
                <span>{formatDate(document.uploaded_at)}</span>
              </div>
              <div className="info-item">
                <label>By:</label>
                <span>
                  {document.uploaded_by_user?.full_name ||
                    document.uploaded_by_user?.email ||
                    'Unknown'}
                </span>
              </div>
              <div className="info-item">
                <label>Size:</label>
                <span>{formatFileSize(document.size_bytes)}</span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge status-${document.document_status}`}>
                  {document.document_status === 'active' ? '✅ Valid' : document.document_status}
                </span>
              </div>
              <div className="info-item">
                <label>Expiry:</label>
                <span>{formatDate(document.expiry_date) || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* AI Parsed Data */}
          {document.ai_parsed_data && (
            <div className="info-section">
              <h3>AI PARSED DATA</h3>
              <div className="ai-confidence">
                <label>Confidence:</label>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${(document.ai_confidence_score || 0) * 100}%` }}
                  />
                  <span>{Math.round((document.ai_confidence_score || 0) * 100)}%</span>
                </div>
              </div>
              <div className="ai-data">
                <pre>{JSON.stringify(document.ai_parsed_data, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="info-section">
            <h3>ACTIONS</h3>
            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={handleDownload}>
                <ArrowDownTrayIcon className="icon-sm" />
                Download
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/hrms/documents/${documentId}/edit`)}
              >
                <PencilIcon className="icon-sm" />
                Edit Info
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/hrms/documents/upload`, {
                  state: {
                    entityType: document.entity_type,
                    entityId: document.entity_id,
                    documentType: document.document_type,
                  },
                })}
              >
                <DocumentPlusIcon className="icon-sm" />
                New Version
              </button>
              <button className="btn btn-danger">
                <TrashIcon className="icon-sm" />
                Delete
              </button>
            </div>
          </div>

          {/* Version History */}
          {versions.length > 1 && (
            <div className="info-section">
              <h3>VERSION HISTORY</h3>
              <div className="version-list">
                {versions.map((version) => (
                  <div
                    key={version.document_id}
                    className={`version-item ${version.document_id === documentId ? 'current' : ''}`}
                  >
                    <div className="version-header">
                      <span className="version-number">v{version.version_number}</span>
                      {version.document_id === documentId && (
                        <span className="version-badge current">CURRENT</span>
                      )}
                      {version.document_id !== documentId && (
                        <span className="version-badge">Superseded</span>
                      )}
                    </div>
                    <div className="version-details">
                      <div>{version.file_name}</div>
                      <div className="version-meta">
                        {formatFileSize(version.size_bytes)} • {formatDate(version.uploaded_at)}
                      </div>
                      {version.start_date && version.expiry_date && (
                        <div className="version-dates">
                          Valid: {formatDate(version.start_date)} - {formatDate(version.expiry_date)}
                        </div>
                      )}
                    </div>
                    <div className="version-actions">
                      <button
                        className="btn-link"
                        onClick={() => navigate(`/hrms/documents/${version.document_id}`)}
                      >
                        View
                      </button>
                      <button className="btn-link" onClick={handleDownload}>
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer
