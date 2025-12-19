import { useState, useEffect, useRef } from 'react'
import {
  XMarkIcon,
  PaperClipIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import './CreateTicketModal.css'

// Request types by department
const REQUEST_TYPES = {
  HR: [
    'Offer Letter',
    'Employment Verification',
    'Payroll Discrepancy',
    'Benefits Inquiry',
    'Leave Request',
    'Tax Forms',
    'Address Change',
    'Direct Deposit Change',
    'Policy Clarification',
    'Other HR Request',
  ],
  Immigration: [
    'GC Processing',
    'H1B Transfer',
    'H1B Extension',
    'H1B Amendment',
    'I-9 Reverification',
    'Visa Stamping',
    'Travel Authorization',
    'LCA Questions',
    'PERM Processing',
    'Dependent Visa',
    'Status Update',
    'Other Immigration',
  ],
}

/**
 * CreateTicketModal Component - Ticket creation form
 * Standalone version for the employee-portal app.
 * Based on UI_DESIGN_DOCS/04_EMPLOYEE_TICKETS.md
 */
function CreateTicketModal({ onClose, onSuccess }) {
  const fileInputRef = useRef(null)

  // Form state
  const [department, setDepartment] = useState('')
  const [requestType, setRequestType] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState([])
  const [validationErrors, setValidationErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Get available request types based on selected department
  const availableRequestTypes = department ? REQUEST_TYPES[department] || [] : []

  // Reset request type when department changes
  useEffect(() => {
    setRequestType('')
  }, [department])

  const validateForm = () => {
    const errors = {}

    if (!department) {
      errors.department = 'Please select a department'
    }

    if (!requestType) {
      errors.requestType = 'Please select a request type'
    }

    if (!subject || subject.length < 10 || subject.length > 200) {
      errors.subject = 'Subject must be 10-200 characters'
    }

    if (!description || description.length < 50 || description.length > 2000) {
      errors.description = 'Description must be 50-2000 characters'
    }

    if (attachments.length > 5) {
      errors.attachments = 'Maximum 5 files allowed'
    }

    const oversizedFiles = attachments.filter((file) => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      errors.attachments = 'Maximum file size is 10MB per file'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const validFiles = files.filter(
      (file) => validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024,
    )
    setAttachments((prev) => [...prev, ...validFiles])
  }

  const handleRemoveFile = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const validFiles = files.filter(
      (file) => validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024,
    )
    setAttachments((prev) => [...prev, ...validFiles])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // In the standalone employee portal this would post to an API.
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to create ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">Create New Ticket</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <XMarkIcon className="icon-md" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ticket-form">
          {submitError && (
            <div className="error-banner">
              <ExclamationCircleIcon className="icon-sm" />
              {submitError}
            </div>
          )}

          {/* Department */}
          <div className="form-group">
            <label htmlFor="department">
              Department <span className="required">*</span>
            </label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={validationErrors.department ? 'error' : ''}
            >
              <option value="">Select Department...</option>
              <option value="HR">HR</option>
              <option value="Immigration">Immigration</option>
            </select>
            {validationErrors.department && (
              <span className="error-message">{validationErrors.department}</span>
            )}
          </div>

          {/* Request Type */}
          <div className="form-group">
            <label htmlFor="request-type">
              Request Type <span className="required">*</span>
            </label>
            <select
              id="request-type"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              disabled={!department}
              className={validationErrors.requestType ? 'error' : ''}
            >
              <option value="">Select Request Type...</option>
              {availableRequestTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {validationErrors.requestType && (
              <span className="error-message">{validationErrors.requestType}</span>
            )}
          </div>

          {/* Subject */}
          <div className="form-group">
            <label htmlFor="subject">
              Subject <span className="required">*</span>
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your request..."
              maxLength={200}
              className={validationErrors.subject ? 'error' : ''}
            />
            <div className="char-count">{subject.length} / 200</div>
            {validationErrors.subject && (
              <span className="error-message">{validationErrors.subject}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about your request. Include relevant dates, amounts, or any specific details that will help us process your request faster."
              rows={6}
              maxLength={2000}
              className={validationErrors.description ? 'error' : ''}
            />
            <div className="char-count">{description.length} / 2000</div>
            {validationErrors.description && (
              <span className="error-message">{validationErrors.description}</span>
            )}
          </div>

          {/* Attachments */}
          <div className="form-group">
            <label htmlFor="attachments">Attachments (Optional)</label>
            <div
              className="file-upload-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperClipIcon className="upload-icon" />
              <p className="upload-text">Drag &amp; drop files here or click to browse</p>
              <p className="upload-hint">
                Supported: PDF, DOC, DOCX, JPG, PNG, XLSX (Max 10MB each)
              </p>
              <input
                ref={fileInputRef}
                id="attachments"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx"
                onChange={handleFileSelect}
                className="file-input-hidden"
                aria-label="Attach files"
              />
            </div>
            {validationErrors.attachments && (
              <span className="error-message">{validationErrors.attachments}</span>
            )}

            {attachments.length > 0 && (
              <div className="uploaded-files">
                {attachments.map((file, index) => (
                  <div key={index} className="uploaded-file">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => handleRemoveFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <XMarkIcon className="icon-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="info-message">
            <p>
              ℹ️ You will receive an email confirmation once your ticket is submitted. Our team
              typically responds within 1-2 business days.
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTicketModal


