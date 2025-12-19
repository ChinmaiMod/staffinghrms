import { useEffect, useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import DependentForm from './DependentForm'
import './DependentsManagement.css'

/**
 * DependentsManagement - Manages employee dependents
 * Based on UI_DESIGN_DOCS/10_VISA_IMMIGRATION.md section 4.1
 */
function DependentsManagement({ employeeId }) {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dependents, setDependents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingDependent, setEditingDependent] = useState(null)

  useEffect(() => {
    if (tenant?.tenant_id && employeeId) {
      fetchDependents()
    }
  }, [tenant?.tenant_id, employeeId])

  const fetchDependents = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id || !employeeId) {
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('hrms_dependents')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setDependents(data || [])
    } catch (err) {
      console.error('Error fetching dependents:', err)
      setError(err.message || 'Failed to fetch dependents')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingDependent(null)
    setShowForm(true)
  }

  const handleEdit = (dependent) => {
    setEditingDependent(dependent)
    setShowForm(true)
  }

  const handleDelete = async (dependentId) => {
    if (!confirm('Are you sure you want to delete this dependent?')) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('hrms_dependents')
        .delete()
        .eq('dependent_id', dependentId)
        .eq('tenant_id', tenant.tenant_id)

      if (deleteError) throw deleteError

      fetchDependents()
    } catch (err) {
      console.error('Error deleting dependent:', err)
      alert('Failed to delete dependent: ' + err.message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingDependent(null)
  }

  const handleFormSave = () => {
    fetchDependents()
    handleFormClose()
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getRelationshipLabel = (relationship) => {
    const labels = {
      spouse: 'Spouse',
      child: 'Child',
      parent: 'Parent',
      sibling: 'Sibling',
      other: 'Other',
    }
    return labels[relationship] || relationship
  }

  const getStatusConfig = (status) => {
    const configs = {
      active: { color: '#10B981', bgColor: '#D1FAE5', label: 'Active' },
      expired: { color: '#991B1B', bgColor: '#FEE2E2', label: 'Expired' },
      pending: { color: '#1E40AF', bgColor: '#DBEAFE', label: 'Pending' },
    }
    return configs[status?.toLowerCase()] || configs.active
  }

  if (loading) {
    return (
      <div className="dependents-management-loading">
        <LoadingSpinner message="Loading dependents..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dependents-management-error">
        <p className="error-message">{error}</p>
      </div>
    )
  }

  return (
    <div className="dependents-management">
      <div className="dependents-header">
        <h3>Dependents</h3>
        <button className="btn-primary btn-sm" onClick={handleAdd}>
          <PlusIcon className="icon-sm" />
          Add Dependent
        </button>
      </div>

      {dependents.length === 0 ? (
        <div className="dependents-empty">
          <p>No dependents found for this employee.</p>
        </div>
      ) : (
        <div className="dependents-list">
          {dependents.map((dependent) => {
            const statusConfig = getStatusConfig(dependent.visa_status)
            const age = calculateAge(dependent.date_of_birth)

            return (
              <div key={dependent.dependent_id} className="dependent-card">
                <div className="dependent-header">
                  <div className="dependent-name-section">
                    <div className="dependent-icon">
                      {dependent.relationship === 'spouse' ? '👩' : '👦'}
                    </div>
                    <div>
                      <h4>
                        {dependent.first_name} {dependent.last_name}
                      </h4>
                      <span className="dependent-relationship">
                        {getRelationshipLabel(dependent.relationship)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dependent-details">
                  {dependent.date_of_birth && (
                    <div className="dependent-detail-row">
                      <span className="detail-label">Date of Birth:</span>
                      <span className="detail-value">
                        {formatDate(dependent.date_of_birth)}
                        {age !== null && ` (${age} years old)`}
                      </span>
                    </div>
                  )}

                  {dependent.visa_type && (
                    <div className="dependent-visa-section">
                      <h5>Visa Status</h5>
                      <div className="dependent-visa-info">
                        <div className="dependent-detail-row">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">{dependent.visa_type}</span>
                        </div>
                        <div className="dependent-detail-row">
                          <span className="detail-label">Status:</span>
                          <span
                            className="visa-status-badge"
                            style={{
                              backgroundColor: statusConfig.bgColor,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        {dependent.visa_expiry_date && (
                          <div className="dependent-detail-row">
                            <span className="detail-label">Valid Until:</span>
                            <span className="detail-value">
                              {formatDate(dependent.visa_expiry_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(dependent.email || dependent.phone) && (
                    <div className="dependent-contact-section">
                      <h5>Contact</h5>
                      {dependent.email && (
                        <div className="dependent-detail-row">
                          <span className="detail-label">📧 Email:</span>
                          <span className="detail-value">{dependent.email}</span>
                        </div>
                      )}
                      {dependent.phone && (
                        <div className="dependent-detail-row">
                          <span className="detail-label">📱 Phone:</span>
                          <span className="detail-value">{dependent.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="dependent-actions">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => handleEdit(dependent)}
                  >
                    <PencilIcon className="icon-sm" />
                    Edit Dependent
                  </button>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDelete(dependent.dependent_id)}
                  >
                    <TrashIcon className="icon-sm" />
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <DependentForm
          employeeId={employeeId}
          dependentId={editingDependent?.dependent_id}
          dependent={editingDependent}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  )
}

export default DependentsManagement
