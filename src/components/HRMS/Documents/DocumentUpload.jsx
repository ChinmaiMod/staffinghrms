import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import './DocumentUpload.css'

/**
 * DocumentUpload - Document upload modal/page
 * URL: /hrms/documents/upload
 * Based on UI_DESIGN_DOCS/09_DOCUMENT_MANAGEMENT.md section 1
 */
function DocumentUpload() {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get context from location state (if coming from checklist)
  const contextFromState = location.state || {}
  const {
    entityType,
    entityId,
    checklistItemId,
    documentType,
    entityName,
  } = contextFromState

  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // Form fields
  const [documentName, setDocumentName] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')
  const [selectedEntityType, setSelectedEntityType] = useState(entityType || 'employee')
  const [selectedEntityId, setSelectedEntityId] = useState(entityId || '')
  const [selectedDocumentType, setSelectedDocumentType] = useState(documentType || '')
  const [startDate, setStartDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [complianceTracking, setComplianceTracking] = useState(false)
  const [visibleToEmployee, setVisibleToEmployee] = useState(true)

  const [entities, setEntities] = useState([])
  const [loadingEntities, setLoadingEntities] = useState(false)

  // Load entities based on selected entity type
  const loadEntities = useCallback(async () => {
    if (!selectedEntityType || !tenant?.tenant_id) return

    try {
      setLoadingEntities(true)
      let query

      if (selectedEntityType === 'employee') {
        query = supabase
          .from('hrms_employees')
          .select('employee_id, first_name, last_name, employee_code')
          .eq('tenant_id', tenant.tenant_id)
          .order('first_name', { ascending: true })

        if (selectedBusiness?.business_id) {
          query = query.eq('business_id', selectedBusiness.business_id)
        }
      } else if (selectedEntityType === 'project') {
        query = supabase
          .from('hrms_projects')
          .select('project_id, project_name, project_code')
          .eq('tenant_id', tenant.tenant_id)
          .order('project_name', { ascending: true })

        if (selectedBusiness?.business_id) {
          query = query.eq('business_id', selectedBusiness.business_id)
        }
      } else {
        setEntities([])
        setLoadingEntities(false)
        return
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setEntities(data || [])
    } catch (err) {
      console.error('Error loading entities:', err)
      setEntities([])
    } finally {
      setLoadingEntities(false)
    }
  }, [selectedEntityType, tenant?.tenant_id, selectedBusiness?.business_id])

  useEffect(() => {
    loadEntities()
  }, [loadEntities])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ]
      if (!validTypes.includes(file.type)) {
        setError(`Unsupported file type: ${file.name}. Supported: PDF, DOC, DOCX, JPG, PNG`)
        return false
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setError(`File size exceeds 10MB limit: ${file.name}`)
        return false
      }

      return true
    })

    const fileObjects = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', // 'pending', 'uploading', 'success', 'error'
      progress: 0,
      error: null,
    }))

    setFiles((prev) => [...prev, ...fileObjects])
    setError(null)
  }

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const uploadFile = async (fileObj) => {
    try {
      // Update file status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      )

      // Create storage path
      const timestamp = Date.now()
      const sanitizedName = fileObj.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${selectedEntityType}/${selectedEntityId || 'temp'}/${timestamp}_${sanitizedName}`

      // Upload to Supabase Storage (assuming bucket name is 'documents')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileObj.file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Update progress
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, progress: 100, status: 'success' } : f
        )
      )

      return {
        file_path: `documents/${storagePath}`,
        file_name: fileObj.name,
        content_type: fileObj.type,
        size_bytes: fileObj.size,
      }
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? { ...f, status: 'error', error: err.message }
            : f
        )
      )
      throw err
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload')
      return
    }

    if (!selectedEntityId && selectedEntityType !== 'system') {
      setError('Please select an entity')
      return
    }

    if (!documentName.trim()) {
      setError('Document name is required')
      return
    }

    try {
      setUploading(true)
      setError(null)

      // Upload all files
      const uploadResults = []
      for (const fileObj of files) {
        if (fileObj.status === 'pending' || fileObj.status === 'error') {
          const result = await uploadFile(fileObj)
          uploadResults.push(result)
        }
      }

      // Create document records in database
      for (const uploadResult of uploadResults) {
        const documentData = {
          tenant_id: tenant.tenant_id,
          business_id: selectedBusiness?.business_id || null,
          entity_type: selectedEntityType,
          entity_id: selectedEntityId || null,
          checklist_item_id: checklistItemId || null,
          document_name: documentName,
          document_description: documentDescription || null,
          document_type: selectedDocumentType || null,
          file_path: uploadResult.file_path,
          file_name: uploadResult.file_name,
          content_type: uploadResult.content_type,
          size_bytes: uploadResult.size_bytes,
          start_date: startDate || null,
          expiry_date: expiryDate || null,
          compliance_tracking_flag: complianceTracking,
          visible_to_employee_flag: visibleToEmployee,
          is_current_version: true,
          version_number: 1,
          document_status: 'active',
          uploaded_by: user?.id || null,
        }

        const { error: insertError } = await supabase
          .from('hrms_documents')
          .insert([documentData])

        if (insertError) throw insertError
      }

      // Success - navigate back
      navigate('/hrms/documents')
    } catch (err) {
      console.error('Error uploading documents:', err)
      setError(err.message || 'Failed to upload documents')
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄'
    if (fileType?.includes('word')) return '📝'
    if (fileType?.includes('image')) return '🖼️'
    return '📎'
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="document-upload" data-testid="document-upload">
      <div className="document-upload-container">
        {/* Header */}
        <div className="document-upload-header">
          <h1>Upload Document</h1>
          <button
            className="icon-button"
            onClick={() => navigate('/hrms/documents')}
            aria-label="Close"
          >
            <XMarkIcon className="icon-md" />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="document-upload-section">
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="upload-zone"
          >
            <input
              type="file"
              id="file-input"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="file-input-hidden"
            />
            <label htmlFor="file-input" className="upload-label">
              <DocumentArrowUpIcon className="upload-icon" />
              <div className="upload-text">
                <span className="upload-primary">Drop files here or click to browse</span>
                <span className="upload-secondary">
                  Supported: PDF, DOC, DOCX, JPG, PNG, JPEG (Max 10MB)
                </span>
              </div>
            </label>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="uploaded-files">
              <h3>UPLOADED FILES</h3>
              <div className="file-list">
                {files.map((fileObj) => (
                  <div key={fileObj.id} className="file-item">
                    <div className="file-info">
                      <span className="file-icon">{getFileIcon(fileObj.type)}</span>
                      <div className="file-details">
                        <div className="file-name">{fileObj.name}</div>
                        <div className="file-meta">
                          Size: {formatFileSize(fileObj.size)}
                        </div>
                      </div>
                    </div>
                    <div className="file-status">
                      {fileObj.status === 'uploading' && (
                        <>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${fileObj.progress}%` }}
                            />
                          </div>
                          <span className="status-text">Uploading...</span>
                        </>
                      )}
                      {fileObj.status === 'success' && (
                        <span className="status-text success">
                          <CheckCircleIcon className="icon-sm" />
                          Upload complete
                        </span>
                      )}
                      {fileObj.status === 'error' && (
                        <span className="status-text error">
                          <XCircleIcon className="icon-sm" />
                          {fileObj.error || 'Upload failed'}
                        </span>
                      )}
                      {fileObj.status === 'pending' && (
                        <span className="status-text">Ready to upload</span>
                      )}
                    </div>
                    <button
                      className="remove-file-button"
                      onClick={() => removeFile(fileObj.id)}
                      aria-label="Remove file"
                    >
                      <XMarkIcon className="icon-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Document Details Form */}
        <div className="document-details-section">
          <h3>DOCUMENT DETAILS</h3>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="document-name">
                Document Name <span className="required">*</span>
              </label>
              <input
                id="document-name"
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., I-9 Form - John Smith"
                required
                data-testid="document-name-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="document-description">Document Description</label>
              <textarea
                id="document-description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="entity-type">Entity Type</label>
              <select
                id="entity-type"
                value={selectedEntityType}
                onChange={(e) => {
                  setSelectedEntityType(e.target.value)
                  setSelectedEntityId('')
                }}
                data-testid="entity-type-select"
              >
                <option value="employee">Employee</option>
                <option value="project">Project</option>
                <option value="timesheet">Timesheet</option>
                <option value="compliance">Compliance</option>
                <option value="system">System</option>
              </select>
            </div>

            {selectedEntityType !== 'system' && (
              <div className="form-group">
                <label htmlFor="entity-id">
                  {selectedEntityType === 'employee' ? 'Employee' : selectedEntityType === 'project' ? 'Project' : 'Entity'}
                </label>
                {loadingEntities ? (
                  <div>Loading...</div>
                ) : (
                  <select
                    id="entity-id"
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    data-testid="entity-id-select"
                  >
                    <option value="">Select {selectedEntityType}</option>
                    {entities.map((entity) => {
                      const label =
                        selectedEntityType === 'employee'
                          ? `${entity.first_name} ${entity.last_name} (${entity.employee_code})`
                          : `${entity.project_name} (${entity.project_code || 'N/A'})`
                      const id =
                        selectedEntityType === 'employee'
                          ? entity.employee_id
                          : entity.project_id

                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="document-type">Document Type</label>
              <select
                id="document-type"
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                data-testid="document-type-select"
              >
                <option value="">Select type</option>
                <option value="passport">Passport</option>
                <option value="visa">Visa</option>
                <option value="i9">I-9 Form</option>
                <option value="w4">W-4 Form</option>
                <option value="h1b">H1B</option>
                <option value="msa">MSA</option>
                <option value="po">PO</option>
                <option value="coi">COI</option>
                <option value="license">License</option>
                <option value="certificate">Certificate</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="start-date-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="expiry-date">Expiry Date</label>
              <input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={startDate || undefined}
                data-testid="expiry-date-input"
              />
            </div>
          </div>

          <div className="tracking-options">
            <h4>TRACKING OPTIONS</h4>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={complianceTracking}
                onChange={(e) => setComplianceTracking(e.target.checked)}
                data-testid="compliance-tracking-checkbox"
              />
              <span>Enable Compliance Tracking</span>
              <span className="help-text">Track expiry and send automated reminders</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleToEmployee}
                onChange={(e) => setVisibleToEmployee(e.target.checked)}
                data-testid="visible-to-employee-checkbox"
              />
              <span>Visible to Employee</span>
              <span className="help-text">Employee can view this document in their portal</span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" data-testid="error-message">
            <ExclamationTriangleIcon className="error-icon" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="document-upload-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/hrms/documents')}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            data-testid="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DocumentUpload
